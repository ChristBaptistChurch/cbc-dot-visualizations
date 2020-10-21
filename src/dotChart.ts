//import * as d3 from 'd3';
import { Filter } from './filter';
import { Bucket } from './bucket';
import { BucketWrapper } from './bucket';
import { getStyles } from './styles.css';
import { Popup } from './popup';
import { style, selection } from 'd3';
import { totalmem } from 'os';

declare var d3;

export interface DotChartOptions {
    attachToId?: string;
    title?: string;
    selectionModeEnabled?: boolean;
}

export abstract class DotChart {
    buckets: Bucket[] = [];
    filters: Filter[] = [];
    svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    xcenter = 0;
    title: string;
    elementId: string;
    lavaTemplate: string;
    entityTypeId: number = 15; // Default to Person
    mergeObjectName: string = 'Row';

    bucketUrl: string;
    entityUrl: string;

    el: HTMLElement = null;
    toolbar: HTMLElement = null;
    styleEl: HTMLStyleElement = null;
    summaryPane: Popup = null;

    selectionMode: boolean = false;
    selections: any[] = [];

    summaryPinned = false;

    _showFilterKey: boolean = true;

    // HashMap to lookup the filters for a given entity without looping through all filters
    filtersForEntity: { [dataId: string]: Array<string> } = {};
    // HashMap to lookup SVG elements for given filter (when disabling or enabling filters)
    elementsForFilter: { [filterId: string]: Array<SVGGraphicsElement> } = {};

    disabledFilters: Array<string> = [];

    private preferences = {
        dotRadius: 10
    }

    constructor(options: DotChartOptions) {

        if (!options || !options.attachToId) {
            this.elementId = "vz" + Date.now();
            this.el = document.createElement('div');
            this.el.id = this.elementId;

            // Insert elements for chart into body before currently running script
            let allScriptTags = document.getElementsByTagName('script');
            let scriptTag = allScriptTags[allScriptTags.length - 1];

            scriptTag.parentNode.insertBefore(this.el, scriptTag);
        } else {
            this.el = document.getElementById(options.attachToId);
            this.elementId = options.attachToId;
        }

        // Add Lava Summary dialog
        this.summaryPane = new Popup();
        this.summaryPane.el.addEventListener("OpenClicked", (e: CustomEvent) => this.openEntityUrl(e.detail));
        this.el.append(this.summaryPane.el);

        // Add toolbar with fullscreen button
        this.toolbar = document.createElement('div');
        this.toolbar.className = "toolbar";


        if (options && options.selectionModeEnabled) {
            let selectionModeButton = document.createElement('div');
            selectionModeButton.innerHTML = '<i class="fa fa-tasks"></i>';
            selectionModeButton.onclick = this.toggleSelectionMode.bind(this);
            selectionModeButton.onmouseover = this.showSelections.bind(this);
            selectionModeButton.onmouseout = this.hideSelections.bind(this);
            selectionModeButton.className = "button selection-mode";
            selectionModeButton.style.backgroundColor = "transparent";
            this.toolbar.append(selectionModeButton);

            let selectionModePane = document.createElement('div');
            selectionModePane.className = "selection-pane";
            selectionModePane.innerHTML = `<div class='toolbar'>
                    <a id="" title="Communicate" class="btn-communicate btn btn-default btn-sm">
                        <i class="fa fa-comment fa-fw"></i>
                    </a>
                    <a id="" title="Merge Person Records" class="btn-merge btn btn-default btn-sm">
                    <i class="fa fa-users fa-fw"></i>
                    </a>
                    <a id="" title="Bulk Update" class="btn-bulk-update btn btn-default btn-sm">
                    <i class="fa fa-truck fa-fw"></i></a>
                    <a id="" title="Export to Excel" class="btn-excelexport btn btn-default btn-sm">
                    <i class="fa fa-table fa-fw"></i></a>
                    <a id="" title="Merge Records into Merge Template" class="btn-merge-template btn btn-default btn-sm">
                    <i class="fa fa-files-o fa-fw"></i></a>
                </div> 
                <div class='body'></div>`;
            selectionModePane.onmouseover = this.showSelections.bind(this);
            selectionModePane.onmouseout = this.hideSelections.bind(this);
            this.el.append(selectionModePane);
        }

        let fullScreenButton = document.createElement('div');
        fullScreenButton.innerHTML = '<i class="fa fa-expand"></i>';
        fullScreenButton.onclick = this.goFullscreen.bind(this);
        fullScreenButton.className = "button";
        fullScreenButton.style.backgroundColor = "transparent";
        this.toolbar.append(fullScreenButton);

        this.el.append(this.toolbar);

        // Add style el
        this.styleEl = document.createElement('style');

        // Add chart SVG
        let newSVGEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSVGEl.id = this.elementId.toString() + "-svg";
        this.el.append(newSVGEl);
        this.el.insertBefore(this.styleEl, newSVGEl);
        this.svg = d3.select(newSVGEl);
        this.title = (options && options.title) || "";

        this.el.addEventListener("fullscreenchange", this.onFullScreen.bind(this));

        if (!this.svg.node()) {
            throw "SVG element does not exist";
        }
    }

    destroy() {
        document.removeChild(<any>this.svg.node());
    }

    onFullScreen() {
        if (document.fullscreenElement == this.el) {
            this.el.style.backgroundColor = "#fafafa";
            let expandElement = this.el.getElementsByClassName('fa-expand')[0];
            expandElement.classList.remove('fa-expand');
            expandElement.classList.add('fa-compress');
            this.rerender();
        } else {
            this.el.style.backgroundColor = "initial";
            let expandElement = this.el.getElementsByClassName('fa-compress')[0];
            this.el.querySelector('svg').style.height = "initial";
            expandElement.classList.remove('fa-compress');
            expandElement.classList.add('fa-expand');
            this.rerender();
        }
    }

    goFullscreen() {
        if (!document.fullscreenElement) {
            this.el.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    toggleSelectionMode() {
        let confirmed = true;
        if (this.selectionMode && this.selections.length) {
            confirmed = confirm('You have entities selected. Are you sure you want to turn off selection mode?');
        }

        if (confirmed) {
            this.selectionMode = !this.selectionMode;
            if (this.selectionMode == true) {
                (<HTMLElement>this.toolbar.querySelector('.selection-mode')).style.backgroundColor = 'orange';
            } else {
                (<HTMLElement>this.toolbar.querySelector('.selection-mode')).style.backgroundColor = 'transparent';
            }
        }
    }

    toggleSelection(d: {Id: number}) {
        let existingSelection = this.selections.find((value) => value = d.Id);

        if (existingSelection) {
            this.selections = this.selections.filter((value) => value != d.Id);
        } else {
            this.selections.push(d.Id);
        }
    }

    showSelections() {
        if (this.selectionMode) {
            let selectionPane = this.el.querySelector('.selection-pane');
            selectionPane.classList.add('open');
        }
    }
    
    hideSelections() {
        let selectionPane = this.el.querySelector('.selection-pane');
        selectionPane.classList.remove('open');
    }


    addBucket(bucket: Bucket): DotChart {
        this.buckets.push(bucket);
        return this;
    }

    /**
     * addFilter
     * 
     * Adds the filter to the chart, and indexes all the people in this filter so we can display them when rendered
     * 
     * @param filter The filter to add to this chart
     */
    addFilter(filter: Filter) {
        this.filters.push(filter);

        if (filter.data) {
            filter.data.forEach((entity) => {
                if (!this.filtersForEntity[entity.Id]) {
                    this.filtersForEntity[entity.Id] = [filter.Id];
                } else {
                    this.filtersForEntity[entity.Id].push(filter.Id);
                }
            })
        }

        if (filter.ActiveByDefault == false) {
            this.disabledFilters.push(filter.Id);
        }

        return this;
    }

    setMergeObjectName(newName: string) {
        this.mergeObjectName = newName;
        return this;
    }

    setEntityType(newEntityTypeId: number) {
        this.entityTypeId = newEntityTypeId;
        return this;
    }

    setLavaSummary(newLavaTemplate: string) {
        this.lavaTemplate = newLavaTemplate;

        return this;
    }

    setEntityUrl(newUrl: string) {
        this.entityUrl = newUrl;
        return this;
    }

    setBucketUrl(newUrl: string) {
        this.bucketUrl = newUrl;
        return this;
    }

    showFilterKey(show: boolean) {
        this._showFilterKey = show;

        return this;
    }

    fetchLavaData(entityId: number): Promise<string> {
        let filtersForLava = '';
        let entityFilters = this.filtersForEntity[entityId]
        if (entityFilters) {
            filtersForLava = `
                {% capture jsonString %}
                    ${JSON.stringify(entityFilters.map((filter) => {
                let filterPrototype: Filter = <any>{};
                Object.assign(filterPrototype, this.filters.find((filterProto) => filterProto.Id == filter));
                delete filterPrototype.data;
                return filterPrototype;
            }))}
                {% endcapture %}
                {% assign Filters = jsonString | FromJSON %}
             `;
        }

        if (this.lavaTemplate) {
            return new Promise<string>((resolve, reject) => {
                fetch(`/api/Lava/RenderTemplate?additionalMergeObjects=${this.entityTypeId}|${this.mergeObjectName}|${entityId}`, {
                    credentials: "include",
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: filtersForLava + this.lavaTemplate
                }).then((response) => {
                    response.json().then((fulfilledLava) => {
                        resolve(fulfilledLava);
                    })
                })
            });
        }

        return null;
    }

    renderFilterKey(x = 0, y = 0) {
        if (this.svg.select('.filters').size()) {
            this.svg.select('.filters').remove();
        }

        let sortedFilters = this.filters.sort((filterA, filterB) => {
            return filterA.Order < filterB.Order ? -1 : 1;
        })

        // Update the filter counts
        for (let filter of sortedFilters) {
            filter.count = (this.elementsForFilter[filter.Id] && this.elementsForFilter[filter.Id].length) || 0;
        }

        let svgFiltersGroupEl = this.svg.insert('g', ':first-child')
            .attr('class', 'filters')
            .attr('style', `transform: translate(${x}px, ${y + 25}px)`);

        let svgFiltersEnter = svgFiltersGroupEl.selectAll('g')
            .data(sortedFilters).enter();

        let filterGroupEl = svgFiltersEnter.append('g')
            .attr('class', (d) => {
                if (this.disabledFilters.includes(d.Id)) {
                    return 'filter disabled';
                } else {
                    return 'filter';
                }
            })
            .on('click', (d) => {
                this.toggleFilter(d.Id);
            });

        let that = this;

        // Render the styled dot
        filterGroupEl.append('circle').attr('r', that.preferences.dotRadius)
            .attr('cy', (d, i) => i * that.preferences.dotRadius * 3)
            .attr('cx', that.preferences.dotRadius * 2)
            .attr('class', (d) => 'filter-' + d.Id)

        // Render the filter label in format "Filter Name (Count)"
        filterGroupEl.append('text').text((d) => d.DisplayAs + ' (' + d.count + ')')
            .attr('x', () => that.preferences.dotRadius * 4)
            .attr('y', (d, i) => i * that.preferences.dotRadius * 3 + 2) // * 3 + 2 = diameter * 1.5 + 2
            .attr('class', 'filter-text');
    }

    /**
     * renderTitle
     * 
     * Renders the title at the top of the scaled SVG Viewbox
     */
    renderTitle(x = 0, y = 0) {
        if (this.svg.select('.visualization-title').size()) {
            this.svg.select('.visualization-title').remove();
        }

        // Render title
        this.svg.append('text').text(this.title)
            .attr('class', 'visualization-title')
            .attr('y', y + 25)
            .attr('x', this.xcenter)
            .attr('style', `font-size: 18pt;`);
    }

    /**
     * renderStyles
     * 
     * Adds a scoped stylesheet to the document for this SVG. Allows using more than
     * one visualization on the same page
     */
    renderStyles() {
        if (!this.elementId) return;

        this.styleEl.textContent = getStyles(this.elementId);

        this.styleEl.textContent += this.filters.map((filter) => {
            return `#${this.elementId} .filter-${filter.Id} { ${filter.CSS} }`;
        }).join(" ");
    }

    dotClicked(d: any) {
        if (this.selectionMode) {
            this.toggleSelection(d.data);
            return;
        }

        if (this.lavaTemplate && !this.selectionMode) {
            this.summaryPane.pin();
            if (this.summaryPane.entity != d.data)
                this.summaryPane.show({ x: (<MouseEvent>event).clientX, y: (<MouseEvent>event).clientY }, this.fetchLavaData(d.data.Id), d.data);
        }
    }

    attachEventHandlers() {
        let dots = this.svg.selectAll('.dot');

        if (this.lavaTemplate) {
            dots.on('mouseover', (d: any) => {
                console.log("mouseover");
                this.summaryPane.preview({ x: (<MouseEvent>event).clientX, y: (<MouseEvent>event).clientY }, this.fetchLavaData(d.data.Id), d.data);
            });

            dots.on('mouseout', (d, i) => {
                console.log("mouseover");
                this.summaryPane.hide();
            })

        }

        dots.on('click', this.dotClicked.bind(this));

        if (this.entityUrl) {
            dots.on('dblclick', (d: any) => {
                this.openEntityUrl(d.data);
            });
        }

        let title = this.svg.select('.visualization-title');

        title.on('mouseover', () => {
            this.summaryPane.preview({ x: (<MouseEvent>event).clientX, y: (<MouseEvent>event).clientY }, this.getChartSummary());
        });

        title.on('mouseout', () => {
            this.summaryPane.hide();
        });

        let buckets = this.svg.selectAll('.bucket .base');

        buckets.on('mouseover', (d: BucketWrapper) => {
            this.summaryPane.preview({ x: (<MouseEvent>event).clientX, y: (<MouseEvent>event).clientY }, this.getBucketHTMLSummary(d));
        });

        buckets.on('mouseout', () => {
            this.summaryPane.hide();
        });

        if (this.bucketUrl) {
            buckets.on('click', (d: any) => {
                this.openBucketUrl(d.data);
            });
        }
    }

    openEntityUrl(entity) {
        window.open(this.entityUrl.replace("{{Id}}", entity.Id.toString()), "_blank");
    }

    openBucketUrl(bucket) {
        // Dynamic buckets won't have an Id
        if (bucket.Id)
            window.open(this.bucketUrl.replace("{{Id}}", bucket.Id.toString()), "_blank");
    }

    prerender() {
        this.elementsForFilter = {};
        this.el.style.height = null;
    }

    rerender() {
        this.renderStyles();

        // Scale to fit
        let rect = (<SVGGraphicsElement>this.svg.node()).getBBox();

        // 50 is the padding
        let newBottom = rect.y + rect.height + 50;
        let newTop = rect.y - 100;
        let newLeft = rect.x - 50;
        let newRight = rect.x + rect.width + 50;

        // We want the center of the diagram always in the center of the screen
        // So the width of the diagram is not it's width; it is the farthest point from the center point * 2
        // xcenter is like CSS transform-origin point. We always want xcenter to be centered on the screen
        let diagramWidth;
        let leftOffsetFromCenter = Math.max(this.xcenter, newLeft) - Math.min(this.xcenter, newLeft);
        let rightOffsetFromCenter = Math.max(this.xcenter, newRight) - Math.min(this.xcenter, newRight);
        if (leftOffsetFromCenter > rightOffsetFromCenter) {
            diagramWidth = leftOffsetFromCenter;
        } else {
            diagramWidth = rightOffsetFromCenter;
        }

        let minHeight = this.el.getBoundingClientRect().height - 40;

        let minWidth = this.el.getBoundingClientRect().width / 2;
        diagramWidth = Math.max(diagramWidth, minWidth);

        if (newBottom - newTop < minHeight) {
            this.el.style.height = newBottom - newTop + "px";
        }

        let viewBox = {
            x: this.xcenter - diagramWidth,
            y: newTop,
            width: diagramWidth * 2,
            height: Math.abs(newBottom - newTop)
        };
        this.svg.attr('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);

        // Calculate the position of the left side of the SVG
        let svgClientRect = ((<HTMLElement>this.svg.node())).getBoundingClientRect();
        let xscale = svgClientRect.width / viewBox.width;
        let yscale = svgClientRect.height / viewBox.height;
        let actualX0 = 0;

        if (xscale < yscale) {
            actualX0 = (this.xcenter - ((svgClientRect.width / 2) * (1 / xscale)));
        } else if (yscale < xscale) {
            actualX0 = (this.xcenter - ((svgClientRect.width / 2) * (1 / yscale)));
        }

        if (this.filters.length && this._showFilterKey) {
            this.renderFilterKey(actualX0, newTop);
        }

        if (this.title) {
            this.renderTitle(this.xcenter, newTop);
        }

        // Attach event handlers
        this.attachEventHandlers();

        this.disabledFilters.forEach((disabledFilterId) => this.hideFilter(disabledFilterId));
    }

    /**
     * Render
     * 
     * Override with specific chart implmentation, and then call this
     * function to scale the chart and draw the filter key
     */
    render() {
        this.rerender();
    }

    hideFilter(filterId: string) {
        let filterKeyElement = (<HTMLElement>this.svg.select('.filter-' + filterId).node());
        if (filterKeyElement) filterKeyElement.parentElement.classList.add('disabled');
        if (this.elementsForFilter[filterId]) {
            for (let element of this.elementsForFilter[filterId]) {
                element.classList.remove('filter-' + filterId);
            }
        }
    }

    showFilter(filterId: string) {
        let filterKeyElement = (<HTMLElement>this.svg.select('.filter-' + filterId).node());
        if (filterKeyElement) filterKeyElement.parentElement.classList.remove('disabled');
        if (this.elementsForFilter[filterId]) {
            for (let element of this.elementsForFilter[filterId]) {
                element.classList.add('filter-' + filterId);
            }
        }
    }

    /**
     * toggleFilter
     * 
     * @param filterId The id of the filter to toggle
     */
    toggleFilter(filterId: string) {
        if (this.disabledFilters.includes(filterId)) {
            // Re-enable
            this.disabledFilters = this.disabledFilters.filter((id) => id != filterId);
            this.showFilter(filterId);
        } else {
            // Disable
            this.disabledFilters.push(filterId);
            this.hideFilter(filterId);
        }
    }

    getBucketHTMLSummary(bucket: BucketWrapper) {
        let filterCounts = {};
        for (let i = 0; i < this.filters.length; i++) {
            filterCounts[i] = bucket.data.data.filter((entity) => {
                let entityId = entity.Id;
                let entityFilters = this.filtersForEntity[entityId];
                return entityFilters && entityFilters.some((eFilter) => eFilter == this.filters[i].Id)
            }).length;
        }

        let displayString = `
            <div style="max-width: 500px;">
                <h2 class="text-center">${bucket.data.DisplayAs || bucket.data.Name}</h2>

                <table>
                    <tr>
                    <th style="width: 75%; margin-right: 5%;"></th>
                    <th style="width: 10%;"></th>
                    <th style="width: 10%;"></th>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Total Count:</td>
                        <td>${bucket.data.data.length}</td>
                    </tr>`;
        for (let filterCount of Object.keys(filterCounts)) {
            displayString += `<tr><td style="font-weight: bold;">${this.filters[filterCount].DisplayAs}:</td><td>${filterCounts[filterCount]}</td><td>(${(filterCounts[filterCount] / (bucket.data.data.length || 1) * 100).toFixed(0)}%)</td></tr>`
        }
        displayString += `</table>
            </div>
        `

        return displayString;
    }

    getChartSummary() {
        let sortedFilters = this.filters.sort((filterA, filterB) => {
            return filterA.Order < filterB.Order ? -1 : 1;
        })

        let totalMembers: number = this.buckets.reduce((previousValue: number, currentValue: Bucket) => {
            return previousValue + currentValue.data.length;
        }, 0);

        // TODO: This is a bit of hack. Venn style charts move some elements into the centerbucket,
        // So we need it for an accurate count even though it only exists on that chart type
        if (this['centerBucket']) {
            totalMembers += this['centerBucket'].data.length;
        }

        let displayString = `
            <div style="max-width: 500px;">
                <h2 class="text-center">${this.title}</h2>

                <table>
                    <tr>
                        <th style="width: 75%; margin-right: 5%;"></th>
                        <th style="width: 10%;"></th>
                        <th style="width: 10%;"></th>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Total Count:</td>
                        <td>${totalMembers}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: center;"><hr><h5>Buckets</h5></tr>
                    </tr>`;
        for (let bucket of this.buckets) {
            displayString += `<tr><td style="font-weight: bold;">${bucket.DisplayAs || bucket.Name}:</td><td>${bucket.data.length}</td><td>(${(bucket.data.length / (totalMembers) * 100).toFixed(0)}%)</td></tr>`
        }
        if (this['centerBucket']) {
            displayString += `<tr><td style="font-weight: bold;">${this['centerBucket'].DisplayAs || this['centerBucket'].Name}:</td><td>${this['centerBucket'].data.length}</td><td>(${(this['centerBucket'].data.length / (totalMembers) * 100).toFixed(0)}%)</td></tr>`
        }
        displayString += `<tr>
            <td colspan="3" style="text-align: center;"><hr><h5>Filters</h5></tr>
        </tr>`;
        for (let filter of sortedFilters) {
            let filterCount = (this.elementsForFilter[filter.Id] && this.elementsForFilter[filter.Id].length) || 0;
            displayString += `<tr><td style="font-weight: bold;">${filter.DisplayAs}:</td><td>${filterCount}</td><td>(${(filterCount / (totalMembers) * 100).toFixed(0)}%)</td></tr>`
        }
        displayString += `</table>
            </div>
        `;

        return displayString;
    }

    /**
     * Attach filter to a dot
     */
    attachFilters(dotEl, d): string {
        let filters = this.filtersForEntity[d.data.Id];

        if (!filters) {
            return 'dot';
        }

        filters.forEach((filter) => {
            if (!this.elementsForFilter[filter]) this.elementsForFilter[filter] = [];
            this.elementsForFilter[filter].push(dotEl);
        });
        return `dot filter-${filters.join(' filter-')}`;
    }
}