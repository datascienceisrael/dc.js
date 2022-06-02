import {map, /*min,*/ sum, set} from 'd3-array';
// import {arc, pie} from 'd3-shape';
import {treemap, /*hierarchy,*/ stratify} from 'd3-hierarchy';
import {select} from 'd3-selection';
// import {interpolate} from 'd3-interpolate';

import {CapMixin} from '../base/cap-mixin';
import {ColorMixin} from '../base/color-mixin';
import {BaseMixin} from '../base/base-mixin';
// import {transition} from '../core/core';
import {d3compat} from '../core/config';

// const DEFAULT_MIN_ANGLE_FOR_LABEL = 0.5;

/**
 * The pie chart implementation is usually used to visualize a small categorical distribution.  The pie
 * chart uses keyAccessor to determine the slices, and valueAccessor to calculate the size of each
 * slice relative to the sum of all values. Slices are ordered by {@link BaseMixin#ordering ordering}
 * which defaults to sorting by key.
 *
 * Examples:
 * - {@link https://dc-js.github.io/dc.js/ Nasdaq 100 Index}
 * @mixes CapMixin
 * @mixes ColorMixin
 * @mixes BaseMixin
 */
export class TreemapChart extends CapMixin(ColorMixin(BaseMixin)) {
    /**
     * Create a Pie Chart
     *
     * @example
     * // create a pie chart under #chart-container1 element using the default global chart group
     * var chart1 = new PieChart('#chart-container1');
     * // create a pie chart under #chart-container2 element using chart group A
     * var chart2 = new PieChart('#chart-container2', 'chartGroupA');
     * @param {String|node|d3.selection} parent - Any valid
     * {@link https://github.com/d3/d3-selection/blob/master/README.md#select d3 single selector} specifying
     * a dom block element such as a div; or a dom element or d3 selection.
     * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
     * Interaction with a chart will only trigger events and redraws within the chart's group.
     */
    constructor (parent, chartGroup) {
        super();

        this._sliceCssClass = 'tree-slice';
        this._labelCssClass = 'tree-label';
        this._sliceGroupCssClass = 'tree-slice-group';
        this._labelGroupCssClass = 'tree-label-group';
        this._emptyCssClass = 'empty-chart';
        this._emptyTitle = 'empty';

        this._g = undefined;

        this._parentAccessor = d => d.parent;

        this.colorAccessor(d => this.cappedKeyAccessor(d));

        this.title(d => `${this.cappedKeyAccessor(d)}: ${this.cappedValueAccessor(d)}`);

        // this.label(d => this.cappedKeyAccessor(d));
        // this.renderLabel(true);

        this.transitionDuration(350);
        this.transitionDelay(0);

        this.anchor(parent, chartGroup);
    }

    _doRender () {
        this.resetSvg();

        this._g = this.svg()
            .append('g')
        /*.attr('transform', `translate(0,0)`)*/;

        this._g.append('g').attr('class', this._sliceGroupCssClass);
        this._g.append('g').attr('class', this._labelGroupCssClass);

        this._padding = 2;

        this._drawChart();

        return this;
    }

    // https://d3-graph-gallery.com/treemap.html
    // https://github.com/d3/d3-hierarchy#stratify
    // https://d3-graph-gallery.com/graph/treemap_basic.html

    _drawChart () {
        // set radius from chart size if none given, or if given radius is too large
        // const maxRadius = min([this.width(), this.height()]) / 2;
        // this._radius = this._givenRadius && this._givenRadius < maxRadius ? this._givenRadius : maxRadius;

        // const arcs = this._buildArcs();
        //
        // const pieLayout = this._pieLayout();

        let pieData;

        const data = this.data();

        // let pieData;
        // if we have data...
        if (sum(data, d => this.cappedValueAccessor(d))) {

            const more = [...new Set(map(data, this.parentAccessor()))].map(p => ({key: [p || 'N/A', '__root']}));

            const root = stratify()
                .id(this.keyAccessor())
                .parentId(this.parentAccessor())(data.concat(more).concat({key: ['__root', '']}));

            root.sum(d => this.cappedValueAccessor(d));
            // augment layout
            treemap().size([this.width(), this.height()]).padding(this._padding)(root)

            pieData = root.leaves();// pieLayout(this.data());
            this._g.classed(this._emptyCssClass, false);
        } else {
            // otherwise we'd be getting NaNs, so override
            // note: abuse others for its ignoring the value accessor
            pieData = []; // pieLayout([{key: this._emptyTitle, value: 1, others: [this._emptyTitle]}]);
            this._g.classed(this._emptyCssClass, true);
        }

        if (this._g) {
            const slices = this._g.select(`g.${this._sliceGroupCssClass}`)
                .selectAll(`g.${this._sliceCssClass}`)
                .data(pieData);

            this._removeElements(slices);

            this._createElements(slices, pieData);

            this._updateElements(pieData);

            this._highlightFilter();

            /*
            transition(this._g, this.transitionDuration(), this.transitionDelay())
                .attr('transform', `translate(${this.cx()},${this.cy()})`);
*/
        }
    }

    _createElements (slices) {
        const slicesEnter = this._createSliceNodes(slices);

        this._createSlicePath(slicesEnter);

        this._createTitles(slicesEnter);
    }

    _createSliceNodes (slices) {
        return slices
            .enter()
            .append('g')
            .attr('class', (d, i) => `${this._sliceCssClass} _${i}`)
            .classed('dc-tabbable', this._keyboardAccessible);
    }

    _createSlicePath (slicesEnter) {
        slicesEnter.append('rect')
            .attr('fill', (d, i) => this._fill(d, i))
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .on('click', d3compat.eventHandler(d => this._onClick(d)));

        if (this._keyboardAccessible) {
            this._makeKeyboardAccessible(this._onClick);
        }

    }

    _createTitles (slicesEnter) {
        if (this.renderTitle()) {
            slicesEnter.append('title').text(d => this.title()(d.data));
        }
    }




    _highlightSlice (i, whether) {
        this.select(`g.tree-slice._${i}`)
            .classed('highlight', whether);
    }

    _updateElements (pieData, arcs) {
        this._updateSlicePaths(pieData, arcs);
        this._updateTitles(pieData);
    }

    _updateSlicePaths (pieData) {
        this._g.selectAll(`g.${this._sliceCssClass}`)
            .data(pieData)
            .select('rect')
            .attr('fill', (d, i) => this._fill(d, i))
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0);

        /*
                const tranNodes = transition(slicePaths, this.transitionDuration(), this.transitionDelay());

                tranNodes.attr('fill', (d, i) => this._fill(d, i));
        */
    }

    _updateTitles (pieData) {
        if (this.renderTitle()) {
            this._g.selectAll(`g.${this._sliceCssClass}`)
                .data(pieData)
                .select('title')
                .text(d => this.title()(d.data));
        }
    }

    _removeElements (slices) {
        slices.exit().remove();
    }

    _highlightFilter () {
        const chart = this;
        if (this.hasFilter()) {
            this.selectAll(`g.${this._sliceCssClass}`).each(function (d) {
                if (chart._isSelectedSlice(d)) {
                    chart.highlightSelected(this);
                } else {
                    chart.fadeDeselected(this);
                }
            });
        } else {
            this.selectAll(`g.${this._sliceCssClass}`).each(function () {
                chart.resetHighlight(this);
            });
        }
    }

    _isSelectedSlice (d) {
        return this.hasFilter(this.cappedKeyAccessor(d.data));
    }

    _doRedraw () {
        this._drawChart();
        return this;
    }

    _sliceHasNoData (d) {
        return this.cappedValueAccessor(d) === 0;
    }

    _fill (d, i) {
        return this.getColor(d.data, i);
    }

    _onClick (d) {
        if (this._g.attr('class') !== this._emptyCssClass) {
            this.onClick(d.data);
        }
    }

    /**
     * @param {String} [cb]
     * @returns {String|TreemapChart}
     */
    parentAccessor (cb) {
        if (arguments.length === 0) {
            return this._parentAccessor;
        }
        this._parentAccessor = cb;
        return this;
    }

    /**
     * Title to use for the only slice when there is no data.
     * @param {String} [title]
     * @returns {String|TreemapChart}
     */
    emptyTitle (title) {
        if (arguments.length === 0) {
            return this._emptyTitle;
        }
        this._emptyTitle = title;
        return this;
    }

    legendables () {
        return this.data().map((d, i) => {
            const legendable = {name: d.key, data: d.value, others: d.others, chart: this};
            legendable.color = this.getColor(d, i);
            return legendable;
        });
    }

    legendHighlight (d) {
        this._highlightSliceFromLegendable(d, true);
    }

    legendReset (d) {
        this._highlightSliceFromLegendable(d, false);
    }

    legendToggle (d) {
        this.onClick({key: d.name, others: d.others});
    }

    _highlightSliceFromLegendable (legendable, highlighted) {
        this.selectAll('g.tree-slice').each(function (d) {
            if (legendable.name === d.data.key) {
                select(this).classed('highlight', highlighted);
            }
        });
    }


}

export const treemapChart = (parent, chartGroup) => new TreemapChart(parent, chartGroup);
