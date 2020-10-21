import { DotChart, DotChartOptions } from './dotChart';
import { Bucket, BucketWrapper, DotWrapper } from './bucket';

declare var d3;

enum ChartStyle {
    Bucket,
    Circle
}

export class ColumnCircleChart extends DotChart {
    dotsPerRow: number = 10;
    dotRadius: number = 10;
    margins: number = 100;
    chartStyle: ChartStyle = ChartStyle.Circle;

    /**
     * Constructor
     * @param svgId The ID of the SVG that already exists in DOM to attach to
     */
    constructor(options?: DotChartOptions) {
        super(options);

        let styleSelector = document.createElement('div');
        styleSelector.className = "group";

        let bucketsStyleButton = document.createElement('div');
        bucketsStyleButton.innerHTML = '<i class="fa fa-chart-bar"></i>';
        bucketsStyleButton.className = "button";
        bucketsStyleButton.onclick = this.setStyleAndRender.bind(this, 'bucket');

        let circleStyleButton = document.createElement('div');
        circleStyleButton.innerHTML = '<i class="far fa-circle"></i>';
        circleStyleButton.className = 'button';
        circleStyleButton.onclick = this.setStyleAndRender.bind(this, 'circle');

        styleSelector.append(bucketsStyleButton, circleStyleButton);

        this.toolbar.prepend(styleSelector);
    }

    setStyle(newStyle: string) {
        if (newStyle == 'bucket') {
            this.chartStyle = ChartStyle.Bucket;
        } else {
            this.chartStyle = ChartStyle.Circle;
        }
        return this;
    }

    setStyleAndRender(newStyle: string) {
        this.setStyle(newStyle);
        this.render();
    }

    /**
     *  Draws a circle style chart
     * 
     */
    renderCircleChart() {
        let baseContainingCircle = {
            padding: 50,
            children: this.buckets.map((bucket) => {
                (<any>bucket).children = bucket.data;
                return bucket;
            })
        }

        // Setup pack layout
        let svgEl: SVGGraphicsElement = <SVGGraphicsElement>this.svg.node();
        svgEl.style.width = "100%";
        let packLayout = d3.pack();
        packLayout.size([svgEl.getBoundingClientRect().width, svgEl.getBoundingClientRect().height])
            .padding((d) => {
                return d.data.padding;
            });
        packLayout.radius(() => 10);
        var root = d3.hierarchy(baseContainingCircle).sum(function (d) { return 5; });
        packLayout(root);

        var that = this;

        // Render group circles
        const bucketGroups = this.svg.insert("g", ':first-child')
            .attr("class", 'diagram')
            .selectAll("g")
            .data(root.children)
            .join("g")
            .attr('class', 'bucket')

        bucketGroups.append('circle')
            .attr('class', function (d: BucketWrapper) {
                that.svg.select('def').append(`path`)
                    .attr('id', `group-${d.data.Id}`)
                    .attr('d', `M ${d.x} ${d.y + 50} m -${d.r}, 0 a ${d.r},${d.r} 0 1,1 ${d.r * 2},0 a ${d.r},${d.r} 0 1,1 ${d.r * -2},0`);

                return 'base';
            })
            .attr('cx', function (d: BucketWrapper) { return d.x; })
            .attr('cy', function (d: BucketWrapper) { return d.y; })
            .attr('r', function (d: BucketWrapper) { return d.r; })


        bucketGroups.each(function (d: BucketWrapper) {
            let bucket = d3.select(this);

            bucket.append('g')
                .selectAll("circle")
                .data(d.children || [])
                .join("circle")
                .attr('class', function (d: BucketWrapper) {
                    return that.attachFilters.call(that, this, d)
                })
                .attr('cx', function (d: BucketWrapper) { return d.x; })
                .attr('cy', function (d: BucketWrapper) { return d.y; })
                .attr('r', function (d: BucketWrapper) { return d.r; })
        })

        // Render group labels
        const labels = this.svg.insert("g", ':first-child')
            //.style("font", "10px sans-serif")
            //.attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("class", "labels")
            .selectAll("text")
            .data(root.children)
            .join("text")
            .attr('class', 'bucket')
            .style('dominant-baseline', 'middle')
            .style('text-anchor', 'start')
            .attr('dy', '-10')
            .style("fill-opacity", (d: BucketWrapper) => d.parent === root ? 1 : 0)
            .style("display", (d: BucketWrapper) => d.parent === root ? "inline" : "none")

        // Make labels for groups follow the circle
        labels.append('textPath')
            .attr('class', 'base')
            .attr('xlink:href', (d: BucketWrapper) => `#group-${d.data.Id}`)
            .text((d: BucketWrapper) => {
                return d.data.DisplayAs || d.data.Name + ' (' + (<any>d.data).children.length + ')'
            });

        // Move parent text to be centered on circle
        labels.attr('dx', function (d: BucketWrapper) {
            let textLength = d3.select(this).node().getComputedTextLength() * 1.2;
            textLength = (((d.r * Math.PI) - textLength) / 2);
            if (textLength < 0) textLength = 0;
            return textLength;
        })
            .selectAll('textPath').attr('textLength', function (d) {
                return d3.select(this).node().parentElement.getComputedTextLength()
            })

        setTimeout(() => {
            this.xcenter = svgEl.getBBox().x + (svgEl.getBBox().width / 2);
        }, 0);
    }

    renderBucketChart() {
        const bucketWidth = this.dotsPerRow * this.dotRadius * 2;

        let scaleTop = 0;
        let svgEl: SVGGraphicsElement = <SVGGraphicsElement>this.svg.node();
        svgEl.style.width = "100%";

        let calculatePositions = (buckets: Bucket[]): BucketWrapper[] => {
            let bucketWrappers: BucketWrapper[] = [];

            let numberOfBuckets = buckets.length;
            let svgHeight = svgEl.getBoundingClientRect().height;
            let svgWidth = svgEl.getBoundingClientRect().width;

            // The gutter width will be however much space is left over after removing the width of all buckets / number of buckets + 1
            let gutterWidth = (svgWidth - (bucketWidth * buckets.length)) / (buckets.length + 1);

            // If there are too many buckets to fit on the SVG, scale the SVG width
            if (gutterWidth < 0) {
                // At this point, we're scaling to fit, so we can just set the gutter to a comfortable width
                gutterWidth = bucketWidth / 4;
            }

            this.xcenter = ((bucketWidth * buckets.length) + (gutterWidth * (buckets.length - 1))) / 2;

            for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
                // Sort the group members by filters, so all of a paritcular stripe appear together
                buckets[bucketIndex].data.sort((a, b) => {
                    let personAFilters = this.filtersForEntity[a.Id];
                    let personAString = personAFilters ? personAFilters.join(' ') : '';
                    let personBFilters = this.filtersForEntity[b.Id];
                    let personBString = personBFilters ? personBFilters.join(' ') : '';
                    return personAString.localeCompare(personBString);
                })

                let bucketWrapper: BucketWrapper = {
                    x: 0,
                    y: 0,
                    children: [],
                    data: buckets[bucketIndex]
                }

                // Position the dots in this bucket
                for (let i = 0; i < buckets[bucketIndex].data.length; i++) {
                    bucketWrapper.children.push(<DotWrapper>{
                        x: (i % this.dotsPerRow) * (this.dotRadius * 2) + this.dotRadius,
                        y: Math.floor(i / this.dotsPerRow) * (this.dotRadius * -2) - this.dotRadius,
                        data: buckets[bucketIndex].data[i]
                    });
                }

                // Position the bucket itself
                bucketWrapper.x = gutterWidth * (bucketIndex) + (bucketWidth * bucketIndex);
                bucketWrapper.y = svgHeight;// - this.margins;

                bucketWrappers.push(bucketWrapper);
            }

            return bucketWrappers;
        }

        let data: BucketWrapper[] = calculatePositions(this.buckets);

        // Render buckets
        let svgBucketsEnter = this.svg.selectAll('g.bucket').data(data)
            .enter()
            .append('g')
            .attr('class', 'bucket')
            .attr("transform", d => `translate(${d.x},${d.y})`);

        svgBucketsEnter.append('g').attr('class', 'dots')

        let base = svgBucketsEnter.append('g').attr('class', 'base');
        base.append('text').text(function (d) {
            return d.data.DisplayAs || d.data.Name + ' (' + d.children.length + ')';
        }).attr('x', bucketWidth / 2)
            .attr('text-anchor', 'middle')
            .attr('class', 'bucket-label')
            .attr('y', 18)

        base.append('line')
            .attr('x1', '0')
            .attr('x2', bucketWidth)
            .attr('y1', '10')
            .attr('y2', '10')
            .attr('class', 'bucket-line')

        let svgBucketDots = svgBucketsEnter.select('.dots').selectAll('circle').data(function (d) {
            return d.children;
        });

        let that = this;

        let svgBucketDotsEnter = svgBucketDots.enter()
            .append('circle')
            .attr('r', this.dotRadius)
            .attr('class', function (d: DotWrapper, i, el) {
                return that.attachFilters.call(that, this, d)
            })
            .attr('cx', function (d) { return d.x })
            .attr('cy', function (d) { return d.y })
    }

    render() {
        if (!this.buckets || !this.buckets.length) {
            let noDataEl = document.createElement('div');
            noDataEl.style.textAlign = "center";
            noDataEl.innerHTML = "No data defined."
            this.el.insertBefore(noDataEl, <Node>this.svg.node());
        } else {

            this.svg.selectAll("*").remove();
            this.svg.append('def');

            const dotRadius = 10;
            const dotsPerRow = 10;

            const margins = 100;

            super.prerender();

            if (this.chartStyle == ChartStyle.Bucket) {
                this.renderBucketChart();
            } else {
                this.renderCircleChart();
            }
        }

        setTimeout(() => {
            super.render();
        }, 10);
    }
}