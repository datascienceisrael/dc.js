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
    constructor() {
        this._parent = undefined;
        this._x = 0;
        this._y = 0;
        this._itemHeight = 12;
        this._gap = 5;

        this._guidelineWidth = 560;

        this._autoItemWidth = false;
        // this._guidelineText = pluck('name');
        this._guidelineText = d => {
            return `${d.data.key}: ${d.data.value}`
        }/*pluck('name')*/;
        this._maxItems = undefined;
        this._highlightSelected = false;
        this._keyboardAccessible = false;

        this._g = undefined;
    }

    parent(p) {
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
    x(x) {
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
    y(y) {
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
    gap(gap) {
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
    highlightSelected(highlightSelected) {
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
    itemHeight(itemHeight) {
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
    guidelineWidth(guidelineWidth) {
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
    autoItemWidth(autoItemWidth) {
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
    guidelineText(guidelineText) {
        if (!arguments.length) {
            return this._guidelineText;
        }
        this._guidelineText = guidelineText;
        return this;
    }

    /**
     * Maximum number of guideline items to display
     * @param  {Number} [maxItems]
     * @return {Guideline}
     */
    maxItems(maxItems) {
        if (!arguments.length) {
            return this._maxItems;
        }
        this._maxItems = utils.isNumber(maxItems) ? maxItems : undefined;
        return this;
    }

    /**
     * If set, individual guideline items will be focusable from keyboard and on pressing Enter or Space
     * will behave as if clicked on.
     *
     * If `svgDescription` on the parent chart has not been explicitly set, will also set the default
     * SVG description text to the class constructor name, like BarChart or HeatMap, and make the entire
     * SVG focusable.
     * @param {Boolean} [keyboardAccessible=false]
     * @returns {Boolean|Guideline}
     */
    keyboardAccessible(keyboardAccessible) {
        if (!arguments.length) {
            return this._keyboardAccessible;
        }
        this._keyboardAccessible = keyboardAccessible;
        return this;
    }

    // Implementation methods

    _guidelineItemHeight() {
        return this._gap + this._itemHeight;
    }

    _makeGuidelineKeyboardAccessible() {

        if (!this._parent._svgDescription) {

            this._parent.svg().append('desc')
                .attr('id', `desc-id-${this._parent.__dcFlag__}`)
                .html(`${this._parent.svgDescription()}`);

            this._parent.svg()
                .attr('tabindex', '0')
                .attr('role', 'img')
                .attr('aria-labelledby', `desc-id-${this._parent.__dcFlag__}`);
        }

        const tabElements = this._parent.svg()
            .selectAll('.dc-guideline .dc-tabbable')
            .attr('tabindex', 0);

        tabElements
            .on('keydown', d3compat.eventHandler((d, event) => {
                // trigger only if d is an object
                if (event.keyCode === 13 && typeof d === 'object') {
                    d.chart.guidelineToggle(d)
                }
                // special case for space key press - prevent scrolling
                if (event.keyCode === 32 && typeof d === 'object') {
                    d.chart.guidelineToggle(d)
                    event.preventDefault();
                }
            }))
            .on('focus', d3compat.eventHandler(d => {
                this._parent.guidelineHighlight(d);
            }))
            .on('blur', d3compat.eventHandler(d => {
                this._parent.guidelineReset(d);
            }));
    }

    render(isRender) {
        this._parent.svg().select('g.dc-guideline').remove();
        const margins = this._parent.margins();
        this._g = this._parent.select('.chart-body').append('g')
            .attr('class', 'dc-guideline')
        /*.attr('transform', `translate(${margins.left},${margins.top})`)*/;

        const xScale = this._parent.x();

        const boundingRect = this._g.append('rect')
            .attr('x', 0)
            .attr('width', this._parent.width() - margins.left - margins.right)
            .attr('y', 0)
            .attr('height', this._parent.height() - margins.top - margins.bottom)
            .style('fill-opacity', 0)
            .style('cursor', 'pointer');


        const line = this._g.append('line')
            .attr('stroke', 'red')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', this._parent.height() - margins.top - margins.bottom);

        boundingRect
            .on('mousemove', (ev, ...props) => {
                // const data = this._parent.data();

                const offset = boundingRect.node().getBoundingClientRect().left;
                // find the nearest point in data to the
                const dx = xScale.invert(ev.x - offset);

                this._drawGuidelineables(dx, ev.x - offset);
                // const guidelineables = this._parent.guidelineables(x);
                // console.table(guidelineables.map(({data}) => data));
                // // debugger;
                line.attr('x1', ev.x - offset)
                    .attr('x2', ev.x - offset)

                // this._g.selectAll('g.dc-guideline-item').data(guidelineables);
            })
            .on('mouseout', (ev, ...props) => {
                line.classed('active', false)
            })
            .on('mouseover', (ev, ...props) => {
                line.classed('active', true)
            })


    }

    _drawGuidelineables(dx, x) {
        const yScale = this._parent.y();

        const g = this._parent.svg().select('g.dc-guideline')
        let guidelineables = this._parent.guidelineables(dx);
        // console.table(guidelineables.map(d => d.data))
        const filters = this._parent.filters();

        if (this._maxItems !== undefined) {
            guidelineables = guidelineables.slice(0, this._maxItems);
        }

        let items = g.selectAll('g.dc-guideline-box').data([guidelineables])
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
            itemEnter.classed(constants.SELECTED_CLASS, d => filters.indexOf(d.name) !== -1);
        }


        // this._g.selectAll('g.dc-guideline-item')
        //     .classed('fadeout', d => d.chart.isGuidelineableHidden(d));

        if (guidelineables.some(pluck('dashstyle'))) {
            itemEnter
                .append('line')
                .attr('x1', 0)
                .attr('y1', this._itemHeight / 2)
                .attr('x2', this._itemHeight)
                .attr('y2', this._itemHeight / 2)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', pluck('dashstyle'))
                .attr('stroke', pluck('color'));
        } else {
            itemEnter
                .append('circle')
                .attr('r', this._itemHeight / 2)
                // .attr('height', this._itemHeight)
                .attr('fill', d => d ? d.color : 'blue');
        }

        {


            itemEnter.append('text')
                .text(this._guidelineText)
                .classed('dc-tabbable', this._keyboardAccessible)
                .attr('x', this._itemHeight + LABEL_GAP)
                .attr('y', () => this._itemHeight / 2 + (this.clientHeight ? this.clientHeight : 13) / 2 - 2);


            // items = g.selectAll('g.dc-guideline-item');
            items.select('text').text(this._guidelineText)

            if (this._keyboardAccessible) {
                this._makeGuidelineKeyboardAccessible();
            }
        }

        // let cumulativeGuidelineTextWidth = 0;
        // let row = 0;

        itemEnter.attr('transform', (d, i) => `translate(0,${i * this._guidelineItemHeight()})`);
    }

}

export const guideline = () => new Guideline();
