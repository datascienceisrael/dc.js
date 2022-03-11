import {pluck, utils} from '../core/utils';
import {d3compat} from '../core/config';
import {constants} from '../core/constants';

const LABEL_GAP = 2;

/**
 * Guideline is a attachable widget that can be added to other dc charts to render horizontal guideline
 * labels.
 *
 * Examples:
 * - {@link https://dc-js.github.io/dc.js/ Nasdaq 100 Index}
 * - {@link https://dc-js.github.io/dc.js/crime/index.html Canadian City Crime Stats}
 * @example
 * chart.guideline(new Guideline().x(400).y(10).itemHeight(13).gap(5))
 * @returns {Guideline}
 */
export class Guideline {
    constructor () {
        this._parent = undefined;
        this._x = 0;
        this._y = 0;
        this._itemHeight = 12;
        this._gap = 5;

        this._guidelineWidth = 560;

        this._autoItemWidth = false;

        this._guidelineText = null;
        this._maxItems = undefined;
        this._highlightSelected = true;


        this._g = undefined;
    }

    parent (p) {
        if (!arguments.length) {
            return this._parent;
        }
        this._parent = p;
        return this;
    }

    /**
     * Set or get x coordinate for guideline widget.
     * @param  {Number} [x=0]
     * @returns {Number|Guideline}
     */
    x (x) {
        if (!arguments.length) {
            return this._x;
        }
        this._x = x;
        return this;
    }

    /**
     * Set or get y coordinate for guideline widget.
     * @param  {Number} [y=0]
     * @returns {Number|Guideline}
     */
    y (y) {
        if (!arguments.length) {
            return this._y;
        }
        this._y = y;
        return this;
    }

    /**
     * Set or get gap between guideline items.
     * @param  {Number} [gap=5]
     * @returns {Number|Guideline}
     */
    gap (gap) {
        if (!arguments.length) {
            return this._gap;
        }
        this._gap = gap;
        return this;
    }

    /**
     * This can be optionally used to enable highlighting guidelines for the selections/filters for the
     * chart.
     * @param {String} [highlightSelected]
     * @return {String|dc.guideline}
     **/
    highlightSelected (highlightSelected) {
        if (!arguments.length) {
            return this._highlightSelected;
        }
        this._highlightSelected = highlightSelected;
        return this;
    }

    /**
     * Set or get guideline item height.
     * @param  {Number} [itemHeight=12]
     * @returns {Number|Guideline}
     */
    itemHeight (itemHeight) {
        if (!arguments.length) {
            return this._itemHeight;
        }
        this._itemHeight = itemHeight;
        return this;
    }

    /**
     * Maximum width for horizontal guideline.
     * @param  {Number} [guidelineWidth=500]
     * @returns {Number|Guideline}
     */
    guidelineWidth (guidelineWidth) {
        if (!arguments.length) {
            return this._guidelineWidth;
        }
        this._guidelineWidth = guidelineWidth;
        return this;
    }


    /**
     * Turn automatic width for guideline items on or off. If true, {@link Guideline#itemWidth itemWidth} is ignored.
     * This setting takes into account the {@link Guideline#gap gap}.
     * @param  {Boolean} [autoItemWidth=false]
     * @returns {Boolean|Guideline}
     */
    autoItemWidth (autoItemWidth) {
        if (!arguments.length) {
            return this._autoItemWidth;
        }
        this._autoItemWidth = autoItemWidth;
        return this;
    }

    /**
     * Set or get the guideline text function. The guideline widget uses this function to render the guideline
     * text for each item. If no function is specified the guideline widget will display the names
     * associated with each group.
     * @param  {Function} [guidelineText]
     * @returns {Function|Guideline}
     * @example
     * // default guidelineText
     * guideline.guidelineText(pluck('name'))
     *
     * // create numbered guideline items
     * chart.guideline(new Guideline().guidelineText(function(d, i) { return i + '. ' + d.name; }))
     *
     * // create guideline displaying group counts
     * chart.guideline(new Guideline().guidelineText(function(d) { return d.name + ': ' d.data; }))
     */
    guidelineText (guidelineText) {
        if (!arguments.length) {
            return this._guidelineText || (d => this._parent.valueAccessor()(d.data));
        }
        this._guidelineText = guidelineText;
        return this;
    }

    /**
     * Maximum number of guideline items to display
     * @param  {Number} [maxItems]
     * @return {Guideline}
     */
    maxItems (maxItems) {
        if (!arguments.length) {
            return this._maxItems;
        }
        this._maxItems = utils.isNumber(maxItems) ? maxItems : undefined;
        return this;
    }

    // Implementation methods

    _guidelineItemHeight () {
        return this._gap + this._itemHeight;
    }



    render (isRender) {
        this._parent.svg().select('g.dc-guideline').remove();
        const margins = this._parent.margins();

        this._g = this._parent.svg().append('g')
            .attr('class', 'dc-guideline')
            .attr('transform', `translate(${margins.left},${margins.top})`);

        const xScale = this._parent.x();

        const boundingRect = this._g.append('rect')
            .attr('x', 0)
            .attr('width', this._parent.width() - margins.left - margins.right)
            .attr('y', 0)
            .attr('height', this._parent.height() - margins.top - margins.bottom)
            .style('fill-opacity', 0)
            .style('cursor', 'pointer');


        const line = this._g.append('line')
            .attr('stroke', '#444')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', this._parent.height() - margins.top - margins.bottom);

        boundingRect
            .on('mousemove', (ev, ...props) => {
                // const data = this._parent.data();

                const {left, width} = boundingRect.node().getBoundingClientRect();
                // find the nearest point in data to the
                const dx = xScale.invert(ev.x - left);

                console.log(ev.x - left, width, (ev.x - left) > (width - 40))
                this._drawGuidelineables(dx, ev.x - left, (ev.x - left) > (width - 40));
                // const guidelineables = this._parent.guidelineables(x);
                // console.table(guidelineables.map(({data}) => data));
                // // debugger;
                line.attr('x1', ev.x - left)
                    .attr('x2', ev.x - left)

                // this._g.selectAll('g.dc-guideline-item').data(guidelineables);
            })
            .on('mouseout', (ev, ...props) => {
                line.classed('active', false)
            })
            .on('mouseover', (ev, ...props) => {
                line.classed('active', true)
            })


    }

    _drawGuidelineables (dx, x, alignRight) {
        const yScale = this._parent.y();

        const g = this._parent.svg().select('g.dc-guideline')
        let guidelineables = this._parent.guidelineables(dx);
        // console.table(guidelineables.map(d => d.data))
        const filters = this._parent.filters();

        if (this._maxItems !== undefined) {
            guidelineables = guidelineables.slice(0, this._maxItems);
        }

        const items = g.selectAll('g.dc-guideline-box')
            .data([guidelineables])
            .join('g')
            .attr('class', 'dc-guideline-box')
            .selectAll('g.dc-guideline-item')
            .data(d => d)
            .attr('transform', d => `translate(${x}, ${yScale(d.chart.valueAccessor()(d.data))})`)
        ;

        const itemEnter = items
                .enter()
                .append('g')
                .attr('class', 'dc-guideline-item')
                .attr('transform', d => `translate(${x}, ${yScale(d.chart.valueAccessor()(d.data))})`)



            /*            .on('mouseover', d3compat.eventHandler(d => {
                            this._parent.guidelineHighlight(d);
                        }))
                        .on('mouseout', d3compat.eventHandler(d => {
                            this._parent.guidelineReset(d);
                        }))
                        .on('click', d3compat.eventHandler(d => {
                            d.chart.guidelineToggle(d);
                        }))*/;

        if (this._highlightSelected) {
            this._parent.highlightGuidelineables(dx);
            itemEnter.classed(constants.SELECTED_CLASS, d => filters.indexOf(d.name) !== -1);
        }


        // this._g.selectAll('g.dc-guideline-item')
        //     .classed('fadeout', d => d.chart.isGuidelineableHidden(d));

        // itemEnter
        //     .append('circle')
        //     .attr('r', this._itemHeight / 2)
        //     // .attr('height', this._itemHeight)
        //     .attr('fill', d => d ? d.color : 'blue');

        itemEnter.append('rect')
            .attr('fill-opacity', .4)
            .attr('fill', '#fafafa')
            .attr('x', alignRight ? (-40 - this._itemHeight - LABEL_GAP) : this._itemHeight + LABEL_GAP)
            .attr('y', -10)
            .attr('width', 40)
            .attr('height', () => this._itemHeight);


        itemEnter.append('text')
            .text(this.guidelineText())
            .attr('text-anchor', alignRight ? 'end' : 'start')
            .attr('x', alignRight ? -40 - (this._itemHeight + LABEL_GAP) : this._itemHeight + LABEL_GAP)
            .attr('y', 0);

        items.select('rect')
            .attr('x', alignRight ? -40 - (this._itemHeight + LABEL_GAP) : this._itemHeight + LABEL_GAP)

        items.select('text').text(this.guidelineText())
            .attr('text-anchor', alignRight ? 'end' : 'start')
            .attr('x', (alignRight ? -1 : 1) * (this._itemHeight + LABEL_GAP))


        // let cumulativeGuidelineTextWidth = 0;
        // let row = 0;

        // itemEnter.attr('transform', (d, i) => `translate(0,${i * this._guidelineItemHeight()})`);
    }

}

export const guideline = () => new Guideline();
