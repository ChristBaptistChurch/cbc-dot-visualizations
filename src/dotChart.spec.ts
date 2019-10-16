import { Bucket } from './bucket';
import { DotChart } from './dotChart';
import { Filter } from './filter';

window['d3'] = require('d3');

class MyDotChart extends DotChart {
    constructor(svgId?: string, title: string = "") {
        super(svgId, title);
    }
}

let sampleBucket = {
    Id: 1,
    Name: "Bucket 1",
    Order: 1,
    Color: 'green',
    data: [{
        Id: 1
    }, {
        Id: 3
    }, {
        Id: 4
    }]
};

let sampleBucket2 = {
    Id: 2,
    Name: "Bucket 2",
    Order: 2,
    Color: 'red',
    data: [{
        Id: 1
    }, {
        Id: 2
    }, {
        Id: 4
    }]
};

describe("DotChart", function () {
    let container;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "mychart";

        document.body.append(container);
    });

    afterEach(() => {
        // Cleanup
        document.body.removeChild(container);

        let dynamicSVG = document.querySelector('div');
        if (dynamicSVG) document.body.removeChild(dynamicSVG);

        document.querySelectorAll('style').forEach((el) => document.body.removeChild(el));
    });

    it("should create", function () {
        let dotChart = new MyDotChart();

        expect(dotChart).toBeTruthy();
    });

    it('should attach to the passed ID', () => {
        let dotChart = new MyDotChart("mychart");

        expect(dotChart.el).toBe(<any>container);
    });

    it('should throw an error if the SVG does not exist', () => {
        document.body.removeChild(container);

        expect(() => { new MyDotChart("mychart") }).toThrow();

        document.body.append(container);
    });

    it('it should create a new SVG if no SVG passed', () => {
        document.body.removeChild(container);
        expect(document.querySelectorAll('svg').length).toBe(0);
        let dotChart = new MyDotChart();

        expect(document.querySelectorAll('svg').length).toBe(1);
        expect(dotChart.svg).toBeTruthy();
        document.body.append(container);
    });

    it('should add a stylesheet to the document', () => {
        let dotChart = new MyDotChart();

        expect(document.getElementsByTagName('style').length).toBe(1);
    });

    // it('should toggle filters when you click on the key', () => {
    //     let dotChart = new MyDotChart("#mysvg");

    //     dotChart.addFilter({
    //         Id: '1',
    //         DataViewName: 'TEST',
    //         ActiveByDefault: false,
    //         CSS: '',
    //         DisplayName: "Test Filter",
    //         Order: 1,
    //         data: [
    //             { Id: 1 }
    //         ]
    //     })

    //     // Draw a dot
    //     let dot = dotChart.svg.append('circle');
    //     dot.call((dot) => dotChart.attachFilters(dot, 1));

    //     // Don't know why this is needed. getBBox is undefined in karma test,
    //     // but not production
    //     spyOn(dotChart.svg, 'node').and.returnValue(<any>{
    //         getBBox: function () {
    //             return {
    //                 x: 0,
    //                 y: 0,
    //                 height: 100,
    //                 width: 100
    //             }
    //         }
    //     })
    //     // Draw the filter key
    //     dotChart.render();

    //     expect(dot.node().className).toBe('dot filter-1 filter-2');

    //     var evObj = new MouseEvent('click', { 'view': window });
    //     (<HTMLElement>dotChart.svg.select('g.filter').node()).dispatchEvent(evObj);

    //     expect(dot.node().className).toBe('dot filter-2');

    //     // TODO: Click filter 2 and make sure both are gone, then reactivate
    // });

    it('should hide disabled filters by default', () => {
        let dotChart = new MyDotChart("mychart");

        dotChart.addFilter({
            Id: '1',
            DisplayAs: "Test Filter",
            ActiveByDefault: false,
            CSS: '',
            DataViewName: "Test Filter",
            Order: 1,
            data: [
                { Id: 100 },
                { Id: 2 },
                { Id: 3 },
                { Id: 4 },
                { Id: 5 }
            ]
        });

        dotChart.render();

        expect(dotChart.disabledFilters).toEqual(['1']);
        expect(dotChart.svg.select('.filter.disabled').size()).toBe(1);
    });

    describe('addBucket', () => {
        it('should add the bucket', () => {
            let dotChart = new MyDotChart();

            let newBucket: Bucket = {
                Id: 1,
                Name: "Test",
                Order: 1,
                Color: 'green',
                data: []
            };

            dotChart.addBucket(newBucket);

            expect(dotChart.buckets[0]).toEqual(newBucket);
        })
    })

    describe('toggleFilter', () => {
        it('should add/remove the filter to the list of disabled filters', () => {
            let dotChart = new MyDotChart();
            expect(dotChart.disabledFilters).toEqual([]);

            dotChart.toggleFilter('1');
            dotChart.toggleFilter('2');

            expect(dotChart.disabledFilters).toEqual(['1', '2']);

            dotChart.toggleFilter('1');

            expect(dotChart.disabledFilters).toEqual(['2']);

        });

        it('it should add/remove the filter class from elements representing filter entities', () => {
            let dotChart = new MyDotChart("mychart");

            dotChart.filtersForEntity[1] = ['1', '2'];

            let dot = dotChart.svg.append('circle');

            dot.attr('class', dotChart.attachFilters(dot.node(), { data: { Id: 1 } }));

            expect(dot.node().className.animVal).toBe('dot filter-1 filter-2');

            dotChart.toggleFilter('1');
            expect(dot.node().className.animVal).toBe('dot filter-2');

            dotChart.toggleFilter('1');
            expect(dot.node().className.animVal).toBe('dot filter-2 filter-1');
        })
    })

    describe('addFilter', () => {
        it('should add the filter', () => {
            let dotChart = new MyDotChart();

            let newFilter: Filter = {
                Id: "1",
                DisplayAs: "Test",
                DataViewName: "Test",
                CSS: "",
                ActiveByDefault: false,
                Order: 1
            };

            dotChart.addFilter(newFilter);

            expect(dotChart.filters[0]).toEqual(newFilter);
        });

        it('should add the filter and filter data to filtersForEntity HashMap', () => {
            let dotChart = new MyDotChart();

            let newFilter: Filter = {
                Id: "1",
                DisplayAs: "Test",
                DataViewName: "Test",
                CSS: "",
                ActiveByDefault: false,
                Order: 1,
                data: [
                    { Id: 1 },
                    { Id: 2 },
                    { Id: 3 },
                    { Id: 4 },
                    { Id: 5 },
                    { Id: 6 },
                    { Id: 7 }
                ]
            };

            dotChart.addFilter(newFilter);

            expect(Object.keys(dotChart.filtersForEntity).length).toBe(7);
            expect(dotChart.filtersForEntity[1]).toEqual(['1']);
        });
    })

    describe('renderFilterKey', () => {
        it('should sort the filters in ascending order', () => {
            // TODO
        });

        it('should draw the key', () => {
            let svgElement = document.createElement('div');
            svgElement.id = "svgChart"
            document.body.append(svgElement);

            let dotChart = new MyDotChart("svgChart");

            dotChart.addFilter({
                DisplayAs: "Test",
                ActiveByDefault: false,
                CSS: '',
                DataViewName: "Test",
                Id: "1",
                Order: 5
            })

            dotChart.renderFilterKey();

            expect(svgElement.querySelectorAll('g.filters').length).toBe(1);
            expect(svgElement.querySelectorAll('.filter').length).toBe(1);
            expect(svgElement.querySelector('.filter text').textContent).toBe("Test (0)");
        });
    });

    describe('render', () => {
        it('should scale the viewbox to fit the entire visual', () => {
            // TODO

            // Draw four dots outside the normal viewport
            // Call render
            // Expect viewbox to be beyond the dots with padding
        });

        it('should attach event handlers', () => {
            let dotChart = new MyDotChart("mychart");

            spyOn(dotChart, 'attachEventHandlers');

            dotChart.render();

            expect(dotChart.attachEventHandlers).toHaveBeenCalled();
        });

        it('should render the filter key (if any filters) in the top left corner', () => {
            let dotChart = new MyDotChart("mychart");

            dotChart.xcenter = 50;

            dotChart.svg.append('g')
                .append('circle').attr('r', 5).attr('cx', 1).attr('cy', 2);

            dotChart.addFilter({
                Id: "1",
                DisplayAs: "Test",
                DataViewName: "Test",
                CSS: "",
                ActiveByDefault: false,
                Order: 1
            });

            spyOn(dotChart, 'renderFilterKey');

            dotChart.render();

            expect(dotChart.renderFilterKey).toHaveBeenCalledWith(jasmine.any(Number), jasmine.any(Number));
        });

        it('should render the title', () => {
            let dotChart = new MyDotChart("mychart", "New Vis");

            spyOn(dotChart, 'renderTitle');

            dotChart.render();
            expect(dotChart.renderTitle).toHaveBeenCalledWith(0, -100);
        });

        it('should call toggleFilter with disabled filters', () => {
            let dotChart = new MyDotChart("mychart", "New Vis");

            dotChart.disabledFilters = ['1', '2', '3', '4'];

            spyOn(dotChart, 'hideFilter');

            dotChart.render();
            expect(dotChart.hideFilter).toHaveBeenCalledTimes(4);
        });
    });

    describe('renderTitle', () => {
        it('should add a text object in the top, center of SVG', () => {
            let dotChart = new MyDotChart("mychart", "My Chart");

            dotChart.renderTitle();

            expect(dotChart.svg.select('text').text()).toBe('My Chart');
        });
    });

    describe('renderStyles', () => {
        it('should set a style for the div to be 100% width and 100vh', () => {
            let dotChart = new MyDotChart("mychart");

            dotChart.renderStyles();

            expect(document.querySelector('style').textContent).toContain(`#mychart {
                display: flex;
                height: calc(100vh - 160px);
                width: 100%;`);
        });

        it('should add styles for each filter', () => {
            let dotChart = new MyDotChart();

            dotChart.addFilter({
                Id: "1",
                DisplayAs: "Test",
                DataViewName: "Test",
                CSS: "fill: green",
                ActiveByDefault: false,
                Order: 1
            });

            dotChart.renderStyles();

            expect(document.querySelector('style').textContent).toContain(".filter-1 { fill: green }");
        });
    });

    describe('fetchLavaData', () => {
        beforeEach(() => {
            spyOn(window, 'fetch').and.returnValue(new Promise((resolve, reject) => {
                resolve(<any>{
                    'json': () => new Promise((resolve, reject) => {
                        resolve("done");
                    })
                })
            }));
        });

        it('should call fetch with the lava template if there is one', () => {
            let dotChart = new MyDotChart();

            dotChart.fetchLavaData(1);

            expect(window.fetch).not.toHaveBeenCalledWith();

            dotChart.setLavaSummary(`Woohoo!`);
            dotChart.fetchLavaData(1);

            expect(window.fetch).toHaveBeenCalledWith(jasmine.any(String), {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: 'Woohoo!'
            });
        });

        it('should fetch a lava template for the given entity', () => {
            let dotChart = new MyDotChart();

            dotChart.setLavaSummary(`Woohoo!`);
            dotChart.fetchLavaData(5);

            expect(window.fetch).toHaveBeenCalledWith(jasmine.stringMatching(/\/api\/Lava\/RenderTemplate\?additionalMergeObjects=[0-9]{1,10}\|Row\|5/), jasmine.any(Object));
        });

        it('should set the entity type for the template to the current entity type', () => {
            let dotChart = new MyDotChart();

            dotChart.setLavaSummary(`Woohoo!`);
            dotChart.setEntityType(4509)
            dotChart.fetchLavaData(5);

            expect(window.fetch).toHaveBeenCalledWith(jasmine.stringMatching(/\/api\/Lava\/RenderTemplate\?additionalMergeObjects=4509\|Row\|[0-9]{1,10}/), jasmine.any(Object));
        });

        it('should set the merge object name', () => {
            let dotChart = new MyDotChart();

            dotChart.setLavaSummary(`Woohoo!`);
            dotChart.setMergeObjectName("MyObj")
            dotChart.fetchLavaData(5);

            expect(window.fetch).toHaveBeenCalledWith(jasmine.stringMatching(/\/api\/Lava\/RenderTemplate\?additionalMergeObjects=[0-9]{1,10}\|MyObj\|[0-9]{1,10}/), jasmine.any(Object));
        });

        // TODO: it should prepend filters for this entity in an accessible manner
    })

    describe('getBucketHTMLSummary', () => {
        it('should return a table with the filter counts for this bucket', () => {
            let dotChart = new MyDotChart();

            dotChart.addBucket(sampleBucket);

            dotChart.addFilter({
                Id: '1',
                DataViewName: 'TEST',
                ActiveByDefault: false,
                CSS: '',
                DisplayAs: "Test Filter",
                Order: 1,
                data: [
                    { Id: 1 }, { Id: 3 }
                ]
            });

            expect(dotChart.getBucketHTMLSummary(<any>{ data: sampleBucket })).toContain(`<td style="font-weight: bold;">Test Filter:</td><td>2 (67%)</td>`);
        });

        describe('attachFilters', () => {
            it('should attach add the filter classes to the dot', () => {
                let dotChart = new MyDotChart();

                dotChart.filtersForEntity[1] = ['1', '2'];

                let dot = dotChart.svg.append('circle');

                dot.attr('class', dotChart.attachFilters(dot.node(), { data: { Id: 1 } }));

                expect(dot.node().className.animVal).toBe('dot filter-1 filter-2');
            });

            it('should maintain a list of which circle elements that are part of a given filter', () => {
                let dotChart = new MyDotChart();

                dotChart.filtersForEntity[1] = ['1', '2'];

                let dot = dotChart.svg.append('circle');

                dot.attr('class', dotChart.attachFilters(dot.node(), { data: { Id: 1 } }));

                expect(dotChart.elementsForFilter[1]).toEqual([dot.node()]);
            });
        });
    });
});
