//import * as d3 from 'd3';
import { Bucket, BucketWrapper, DotWrapper } from './bucket';
import { DotChart, DotChartOptions } from './dotChart';
import { style } from 'd3';

declare var d3;

export interface BucketIntersections {
    [intersectingBucketId: string]: Bucket;
}

/**
 * IntertedVenn Chart
 * 
 * This chart will show up to 3 buckets of data and additional buckets representing their intersections.
 * 
 */
export class CircularVenn extends DotChart {
    intersections: { [bucketId: string]: BucketIntersections };

    centerBucket: Bucket = <any>{};

    /**
     * Constructor
     * @param svgId The ID of the SVG that already exists in DOM to attach to
     */
    constructor(options?: DotChartOptions) {
        super(options);
    }

    addBucket(bucket: Bucket): CircularVenn {
        return <CircularVenn>super.addBucket(bucket);
    }

    calculateBucketIntersections() {
        if (this.buckets.length == 1) {
            this.centerBucket = {
                Id: this.buckets[0].Id,
                Color: this.buckets[0].Color,
                Order: null,
                Name: this.buckets[0].Name,
                DisplayAs: this.buckets[0].DisplayAs,
                data: this.buckets[0].data
            }
            this.buckets = [];
        } else if (this.buckets.length == 2) {
            Bucket.getIntersection(this.buckets[0], this.buckets[1], (intersection, bucket1NonIntersect, bucket2NonIntersect) => {
                this.centerBucket = intersection;
                this.centerBucket.dynamic = true;
                this.buckets = [bucket1NonIntersect, bucket2NonIntersect];
            });
        } else if (this.buckets.length == 3) {
            // TODO: This is very hard to read
            // These lines calculate all the intersections of the Venn diagram
            Bucket.getIntersection(this.buckets[0], this.buckets[1], (intersection12, bucket1Without2, bucket2Without1) => {
                Bucket.getIntersection(intersection12, this.buckets[2], (intersection123, intersection12Excluding3, bucket3ExcludingIntersection12) => {
                    Bucket.getIntersection(bucket1Without2, bucket3ExcludingIntersection12, (intersection13excluding2, bucket1Without23, bucket3Without1OrIntersection12) => {
                        Bucket.getIntersection(bucket2Without1, bucket3Without1OrIntersection12, (intersection23excluding1, bucket2Without13, bucket3without12) => {
                            this.centerBucket = intersection123;
                            intersection12Excluding3.dynamic = true;
                            intersection23excluding1.dynamic = true;
                            intersection13excluding2.dynamic = true;
                            this.centerBucket.dynamic = true;
                            this.buckets = [bucket1Without23, intersection12Excluding3, bucket2Without13, intersection23excluding1, bucket3without12, intersection13excluding2];
                        });
                    });
                });
            });
        }
    }

    renderBuckets() {
        function getArc(cx, cy, r, start, end, sweepFlag = 1) {
            const endAngle = end * (Math.PI / 180);
            const startAngle = start * (Math.PI / 180);
            let largeArcFlag = 0;

            if ((endAngle - startAngle) >= Math.PI) {
                largeArcFlag = 1;
            }

            let startX = cx + (r * Math.cos(startAngle));
            let startY = cy + (r * Math.sin(startAngle));
            let endX = startX - (r * Math.cos(startAngle)) + (r * Math.cos(startAngle + (endAngle - startAngle)));
            let endY = startY - (r * Math.sin(startAngle)) + (r * Math.sin(startAngle + (endAngle - startAngle)));
            return `M ${startX} ${startY} A ${r}, ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
        }

        let degreeRangeOfEachBucket = 360 / this.buckets.length;
        let initialDegreeOffset = -90;
        let overlap = 1;

        // Locate the center of the diagram that the arcs will circle
        // (this really could be anywhere because of the SVG viewbox)
        let centerCircleBBox = (<SVGGraphicsElement>this.svg.select('.center-bucket').node()).getBBox();
        let centerCircleX = centerCircleBBox.x + (centerCircleBBox.width / 2);
        this.xcenter = centerCircleX;
        let centerCircleY = centerCircleBBox.y + (centerCircleBBox.height / 2);


        // + 50 is the padding to leave from inner circles
        let arcCircleRadius = (Math.max(centerCircleBBox.width, centerCircleBBox.height) / 2) + 50;

        // Add another center circle so a hover will show statistics
        this.svg.select('.center-bucket').insert("circle", ":first-child")
            .data([{ data: this.centerBucket }])
            .attr('class', 'base')
            .attr('cx', centerCircleX)
            .attr('cy', centerCircleY)
            .attr('r', arcCircleRadius)
            .style('fill', 'transparent')
            .style('stroke', (d) => d.data.Color)
            .style('stroke-width', "25px");

        // let chartGroup = this.svg.append('g');
        // let chartArcEnter = chartGroup.selectAll('g').data(this.buckets).enter();

        let bucketWrappers = [];
        // Calculate the arc and dot positions
        for (let i = 0; i < this.buckets.length; i++) {

            let bucketWrapper: BucketWrapper = {
                children: [],
                data: this.buckets[i],
                startingDegree: null,
                endingDegree: null,
                x: null,
                y: null,
                r: null,
                overlapDegrees: null
            }

            // Set bucket arc properties
            bucketWrapper.startingDegree = (degreeRangeOfEachBucket * (i - 1)) + initialDegreeOffset;
            bucketWrapper.endingDegree = degreeRangeOfEachBucket * i + initialDegreeOffset
            bucketWrapper.x = centerCircleX;
            bucketWrapper.y = centerCircleY;
            bucketWrapper.r = arcCircleRadius;
            bucketWrapper.overlapDegrees = overlap;

            // Calculate dot positions
            let currentDot = 0;
            let maxDot = this.buckets[i].data.length
            let currentRow = 0;
            let dotGroup;

            while (currentDot < maxDot) {
                let padding = 5;
                let arcLengthBetweenDots = (10 * 2) + 2;
                let incrementToPlot = (arcLengthBetweenDots / (2 * Math.PI * (arcCircleRadius + (currentRow * 20) + 25))) * 360;

                let currentDegree = bucketWrapper.startingDegree + padding;
                while (currentDegree < (bucketWrapper.endingDegree - padding) && currentDot < maxDot) {
                    let radians = currentDegree * (Math.PI / 180);
                    let x = centerCircleX + ((arcCircleRadius + (currentRow * 20) + 25) * Math.cos(radians));
                    let y = centerCircleY + ((arcCircleRadius + (currentRow * 20) + 25) * Math.sin(radians));

                    // Set dot position
                    let dotWrapper: DotWrapper = {
                        data: bucketWrapper.data.data[currentDot],
                        x: x,
                        y: y,
                        r: 10
                    }

                    bucketWrapper.children.push(dotWrapper);

                    currentDot++;
                    currentDegree += incrementToPlot;
                }

                currentRow++;
            }

            bucketWrappers.push(bucketWrapper);
        }

        // Draw the elements
        let bucketsEnter = this.svg.append('g').attr('class', 'chart-body').selectAll('g').data(bucketWrappers).enter();

        let bucketGroup = bucketsEnter.append('g').attr('class', 'bucket');

        // Draw arc
        bucketGroup
            .append('path')
            .attr('class', 'base')
            .attr('d', (d) => {
                return getArc(d['x'], d['y'], d['r'], d['startingDegree'] - d['overlapDegrees'], d['endingDegree'] + d['overlapDegrees']);
            })
            .attr('style', (d) => `fill: none; stroke: ${d.data.Color}; stroke-width: 25px;`);

        let dotsEnter = bucketGroup.append('g').attr('class', 'dots').selectAll('circle').data((d) => d.children).enter();

        let that = this;
        dotsEnter.append('circle')
            .attr('class', function (d: DotWrapper, i, el) {
                return that.attachFilters.call(that, this, d)
            })
            .attr('r', (d: DotWrapper) => d.r)
            .attr('cx', (d: DotWrapper) => d.x)
            .attr('cy', (d: DotWrapper) => d.y)
    }

    renderCenterCircle() {
        var baseContainingCircle = {
            "name": this.centerBucket.DisplayAs || this.centerBucket.Name,
            "padding": 2,
            "children": [
                ...this.centerBucket.data
            ],
            "data": [
                this.centerBucket.data
            ]
        }

        let svgBBox = (<HTMLElement>this.svg.node()).getBoundingClientRect()

        // Setup pack layout
        let packLayout = d3.pack();
        packLayout.size([svgBBox.height / 2, svgBBox.width / 2])
            .padding((d) => {
                return (<any>d.data).padding;
            });
        packLayout.radius(() => 10);
        var root = d3.hierarchy(baseContainingCircle);//.sum(function (d) { return 5; });
        let rootNode = packLayout(root);

        // Render circles
        const centerGroup = this.svg.insert("g", ':first-child')
            .attr("class", 'center-bucket bucket');

        var that = this;

        centerGroup.selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            // .attr('class', function (d) {
            //     if (d.parent === root) {
            //         this.svg.select('def').append(`path`)
            //             .attr('id', `group-${d.data.id}`)
            //             .attr('d', `M ${d.x} ${d.y + 50} m -${d.r}, 0 a ${d.r},${d.r} 0 1,1 ${d.r * 2},0 a ${d.r},${d.r} 0 1,1 ${d.r * -2},0`);

            //         return 'dot group';
            //     }

            //     if (peopleInDataViews[d.data.PersonId || d.data.Id]) {
            //         return 'dot ' + peopleInDataViews[d.data.PersonId || d.data.Id].filter((filter) => !disabledFilters.includes(filter)).join(' ');
            //     } else {
            //         return 'dot';
            //     }
            // })
            .attr('class', function (d) {
                return that.attachFilters.call(that, this, d);
            })
            .attr('cx', function (d: any) { return d.x; })
            .attr('cy', function (d: any) { return d.y; })
            .attr('r', function (d: any) { return d.r; })
    }

    /**
     * renderBucketKey
     * 
     * Render a color key at the bottom of teh chart to help identify the buckets
     */
    renderBucketKey() {
        let svgBBox = (<SVGGraphicsElement>this.svg.node()).getBBox();

        let keyY = svgBBox.y + svgBBox.height + 100;
        let keyX = this.xcenter;

        let bucketKeyGroup = this.svg.append('g').attr('class', 'bucket-key');

        let totalWidth = 0;
        let currentX = 0;

        let bucketKeyGroupEnter = bucketKeyGroup.selectAll('g').data(this.buckets.concat(this.centerBucket).filter((bucket) => bucket.dynamic != true)).enter();

        let bucketKeyItemGroup = bucketKeyGroupEnter.append('g');
        bucketKeyItemGroup.append('rect').attr('width', '20').attr('height', '20').attr('fill', (d) => d.Color);
        bucketKeyItemGroup.append('text').text((d) => d.DisplayAs || d.Name);

        // Calculate positions of each key item so that they're centered on the screen
        bucketKeyGroup.selectAll('g').each(function () { totalWidth += (<SVGGraphicsElement>d3.select(this).node()).getBBox().width + 50; })

        currentX = keyX - (totalWidth / 2);

        bucketKeyGroup.selectAll('g').each(function (bucket, index, el) {
            let thisGroup = d3.select(this);
            thisGroup.select('rect').attr('x', currentX).attr('y', keyY);
            thisGroup.select('text').attr('x', currentX + 30).attr('y', keyY + 11).attr('dominant-baseline', 'middle'); // 11 is midpoint of rect
            currentX += (<SVGGraphicsElement>thisGroup.node()).getBBox().width + 20;
        });
    }

    render() {
        if (!this.buckets || !this.buckets.length) {
            let noDataEl = document.createElement('div');
            noDataEl.style.textAlign = "center";
            noDataEl.innerHTML = "No data defined."
            this.el.insertBefore(noDataEl, <Node>this.svg.node());
        } else {
            super.prerender();

            this.calculateBucketIntersections();
            this.renderCenterCircle();
            this.renderBuckets();
            this.renderBucketKey();
        }
        super.render();

    }
}