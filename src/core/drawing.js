
    //
    // A drawing is drawn on a group
    function drawing (group, renderer, draw) {
        var uid = ++_idCounter,
            x = d3_geom_pointX,
            y = d3_geom_pointY,
            size = default_size,
            name,
            data,
            opts,
            formatY,
            dataConstructor;

        draw = highlightMixin(drawingOptions, draw);

        var set = draw.set;

        draw.uid = function () {
            return 'giottodraw' + uid;
        };

        draw.remove = noop;

        draw.render = function () {
            if (renderer)
                return renderer.call(draw);
        };

        draw.group = function () {
            return group;
        };

        draw.draw = function () {
            return draw;
        };

        draw.factor = function () {
            return group.factor();
        };

        draw.paper = function () {
            return group.paper();
        };

        draw.each = function (callback) {
            if (data)
                data.forEach(function (d) {
                    callback.call(d);
                });
            else
                callback.call(draw);
        };

        draw.renderer = function (_) {
            if (arguments.length === 0) return renderer;
            renderer = _;
            return draw;
        };

        draw.options = function (_) {
            if (arguments.length === 0) return opts;
            opts = _;
            if (isFunction(opts.x)) draw.x(opts.x);
            if (isFunction(opts.y)) draw.y(opts.y);
            draw.init(draw, opts);
            return draw;
        };

        // set a value and its default
        draw.set = function (name, value) {
            if (pointOptions.indexOf(name) === -1) {
                opts[name] = value;
            } else if (data) {
                data.forEach(function (d) {
                    d.set(name, value);
                });
            } else
                set(name, value);
            return draw;
        };

        draw.x = function (_) {
            if (arguments.length === 0) return x;
            x = d3_functor(_);
            return draw;
        };

        draw.y = function (_) {
            if (arguments.length === 0) return y;
            y = d3_functor(_);
            return draw;
        };

        draw.formatY = function (y) {
            if (!formatY) formatY = d3.format(opts.formatY || 'n');
            return formatY(y);
        };

        draw.size = function (_) {
            if (arguments.length === 0) return size;
            size = d3_functor(_);
            return draw;
        };

        draw.name = function (_) {
            if (arguments.length === 0) return name;
            name = _;
            return draw;
        };

        draw.scalex = function () {
            var scalex = group.xaxis().scale();
            return function (d) {
                return scalex(x(d));
            };
        };

        draw.scaley = function () {
            var scaley = group.yaxis().scale();
            return function (d) {
                return scaley(y(d));
            };
        };

        draw.data = function (_) {
            if (arguments.length === 0) return data;
            if (dataConstructor)
                data = dataConstructor.call(draw, _);
            else
                data = _;
            return draw;
        };

        draw.dataConstructor = function (_) {
            if (arguments.length === 0) return dataConstructor;
            dataConstructor = d3_functor(_);
            return draw;
        };

        return draw;

        function _set(name, value) {
            if (typeof draw[name] === 'function')
                draw[name](value);
            else
                draw[name] = value;
        }
    }

    // A mixin for highlighting elements
    //
    // THis is used by the drawing and paperData constructors
    function highlightMixin (parameters, d) {
        var values = {},
            opts,
            highlight = false;

        d || (d = {});

        d.highLight = function () {
            if (highlight) return d;
            highlight = true;

            var a = d.active,
                v;
            if (a) {
                parameters.forEach(function (name) {
                    v = a[name];
                    if (v) {
                        if (multiplyOptions.indexOf(name) > -1)
                            v *= values[name];
                        d[name] = v;
                    }
                });
            }
            return d;
        };

        // set a value and its default
        d.set = function (name, value) {
            if (parameters.indexOf(name) > -1) {
                values[name] = value;
                d[name] = value;
            }
            return d;
        };

        d.reset = function () {
            highlight = false;
            parameters.forEach(function (name) {
                d[name] = values[name];
            });
            return d;
        };

        d.init = function (data, opts) {
            parameters.forEach(function (name) {
                values[name] = data[name] || opts[name];
            });
            if (opts.active) {
                if (!data.active)
                    data.active = {};
                copyMissing(opts.active, data.active);
                activeColors(data);
            }
            return d.reset();
        };

        d.setBackground = function (e) {
            d.group().setBackground(d, e);
            return d;
        };

        return d;
    }
    //
    // Manage attributes for data to be drawn on papers
    function paperData (draw, data, parameters, d) {
        var opts = draw.options();
        d = highlightMixin(parameters, d);
        if (isArray(data))
            d.init(d, opts);
        else {
            d.init(data, opts);
            d.active = data.active;
        }

        d.data = data;

        d.options = function () {
            return opts;
        };

        d.draw = function () {
            return draw;
        };

        d.group = function () {
            return draw.group();
        };

        return d;
    }

    function point (draw, data, size) {
        var d = paperData(draw, data, pointOptions);
        d.set('size', data.size === undefined ? size : data.size);
        return d;
    }

    function pieSlice (draw, data) {
        // Default values
        var d = {},
            dd = isArray(data) ? d : data;
        dd.fill = dd.fill || draw.paper().pickColor();
        dd.color = dd.color || d3.rgb(dd.fill).darker().toString();

        return paperData(draw, data, pieOptions, d);
    }

    var SymbolSize = {
            circle: 0.7,
            cross: 0.7,
            diamond: 0.7,
            "triangle-up": 0.6,
            "triangle-down": 0.6
        },

        drawingOptions = ['fill', 'color', 'fillOpacity',
                        'colorOpacity', 'lineWidth'],

        pointOptions = extendArray(['size', 'symbol'], drawingOptions),

        pieOptions = extendArray(['innerRadius', 'outerRadius'], drawingOptions),

        multiplyOptions = ['lineWidth', 'size', 'innerRadius', 'outerRadius'],

        default_size = function (d) {
            return d.size;
        },

        point_size = function (d) {
            return d.size*d.size*(SymbolSize[d.symbol] || 1);
        };

