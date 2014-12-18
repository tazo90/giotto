
    g.createviz('chart', {
        margin: {top: 30, right: 30, bottom: 30, left: 30},
        chartTypes: ['pie', 'bar', 'line', 'point']
    },

    function (chart, opts) {

        var series = [],
            allranges = {};

        chart.numSeries = function () {
            return series.length;
        };

        // iterator over each serie
        chart.each = function (callback) {
            series.forEach(callback);
            return chart;
        };

        chart.forEach = chart.each;

        chart.addSeries = function (series) {
            addSeries(series);
            return chart;
        };

        chart.addSerie = function (serie) {
            addSeries([serie]);
            return chart;
        };

        chart.clear = function () {
            chart.paper().clear();
            series = [];
            return chart;
        };

        chart.draw = function (data) {
            var paper = chart.paper();
            data = data || opts.data;

            // load data if in options
            if (data === undefined && opts.src) {
                opts.data = null;
                return chart.loadData(chart.draw);
            }

            if (isFunction(data))
                data = data(chart);

            opts.data = null;

            if (data || opts.type !== paper.type()) {

                if (data)
                    data = addSeries(data);

                if (opts.type !== paper.type()) {
                    paper = chart.paper(true);
                    data = series;
                }

                data.forEach(function (serie) {
                    drawSerie(serie);
                });
            }

            // Render the chart
            return chart.render();
        };

        chart.setSerieOption = function (type, field, value) {

            if (opts.chartTypes.indexOf(type) === -1) return;

            if (!chart.numSeries()) {
                opts[type][field] = value;
            } else {
                chart.each(function (serie) {
                    if (serie[type])
                        serie[type].set(field, value);
                });
            }
        };


        chart.on('tick.main', function () {
            // Chart don't need ticking unless explicitly required (real time updates for example)
            chart.stop();
            chart.draw();
        });

        // INTERNALS

        function formatSerie (serie) {
            if (!serie) return;
            if (isArray(serie)) serie = {data: serie};

            var paper = chart.paper(),
                color, show, o;

            serie.index = series.length;

            series.push(serie);

            if (!serie.label)
                serie.label = 'serie ' + series.length;

            opts.chartTypes.forEach(function (type) {
                o = serie[type];
                if (isArray(o) && !serie.data) {
                    serie.data = o;
                    o = {}; // an ampty object so that it is shown
                }
                if (o || opts[type].show) {
                    serie[type] = extend({}, opts[type], o);
                    show = true;
                }
            });

            // None of the chart are shown, specify line
            if (!show)
                serie.line = extend({}, opts.line);

            opts.chartTypes.forEach(function (type) {
                o = serie[type];

                if (o && type !== 'pie' && !o.color) {
                    // pick a default color if one is not given
                    if (!color)
                        color = paper.pickColor();
                    o.color = color;
                }
            });

            return serie;
        }

        function addSeries (series) {
            // Loop through series and add them to the chart series collection
            // No drawing nor rendering involved
            var data = [], ranges, range;

            series.forEach(function (serie) {

                if (isFunction(serie))
                    serie = serie(chart);

                serie = formatSerie(serie);

                if (serie) {
                    // Not a pie chart, check axis and ranges
                    if (!serie.pie) {

                        serie = xyData(serie);

                        if (serie.yaxis === undefined)
                            serie.yaxis = 1;
                        if (!serie.group) serie.group = 1;

                        ranges = allranges[serie.group];

                        if (!ranges) {
                            // ranges not yet available for this chart group,
                            // mark the serie as the reference for this group
                            serie.reference = true;
                            allranges[serie.group] = ranges = {};
                        }

                        if (!isObject(serie.xaxis)) serie.xaxis = opts.xaxis;
                        if (serie.yaxis === 2) serie.yaxis = opts.yaxis2;
                        if (!isObject(serie.yaxis)) serie.yaxis = opts.yaxis;

                        range = ranges[serie.xaxis.position];
                        if (!range) {
                            ranges[serie.xaxis.position] = range = [serie.xrange[0], serie.xrange[1]];
                            serie.drawXaxis = true;
                        } else {
                            range[0] = Math.min(range[0], serie.xrange[0]);
                            range[1] = Math.max(range[1], serie.xrange[1]);
                        }
                        range = ranges[serie.yaxis.position];
                        if (!range) {
                            ranges[serie.yaxis.position] = range = [serie.yrange[0], serie.yrange[1]];
                            serie.drawYaxis = true;
                        } else {
                            range[0] = Math.min(range[0], serie.yrange[0]);
                            range[1] = Math.max(range[1], serie.yrange[1]);
                        }
                    }
                    data.push(serie);
                }
            });

            return data;
        }

        function drawSerie (serie) {
            // Draw a serie

            // Remove previous serie drawing if any
            opts.chartTypes.forEach(function (type) {
                stype = serie[type];
                if (stype) {
                    if(isFunction(stype.options))
                        stype = stype.options();
                    serie[type] = stype;
                }
            });

            // Create the group for the serie
            var paper = chart.paper(),
                group = paper.classGroup(slugify(serie.label), extend({}, serie)),
                stype;

            // is this the reference serie for its group?
            group.element().classed('chart' + chart.uid(), true)
                           .classed('reference' + chart.uid(), serie.reference);

            function domain(axis) {
                var range = allranges[serie.group][axis.orient()],
                    o = axis.options(),
                    scale = axis.scale();

                if (o.auto) {
                    scale.domain([range[0], range[1]]).nice();
                    if (!isNull(o.min))
                        scale.domain([o.min, scale.domain()[1]]);
                    else if (!isNull(o.max))
                        scale.domain([scale.domain()[0], o.max]);
                } else {
                    scale.domain([o.min, o.max]);
                }
                return group;
            }

            if (serie.drawXaxis)
                domain(group.xaxis()).drawXaxis();

            if (serie.drawYaxis)
                domain(group.yaxis()).drawYaxis();

            opts.chartTypes.forEach(function (type) {
                stype = serie[type];
                if (stype)
                    serie[type] = chartTypes[type](group, serie.data, stype);
            });
        }

    });

    var chartTypes = {

        pie: function (group, data, opts) {
            return group.pie(data, opts);
        },

        bar: function (group, data, opts) {
            return group.barchart(data, opts)
                        .x(function (d) {return d.x;})
                        .y(function (d) {return d.y;});
        },

        line: function (group, data, opts) {
            return group.path(data, opts)
                        .x(function (d) {return d.x;})
                        .y(function (d) {return d.y;});
        },

        point: function (group, data, opts) {
            return group.points(data, opts)
                        .x(function (d) {return d.x;})
                        .y(function (d) {return d.y;});
        }
    };

    var xyData = function (data) {
        if (!data) return;
        if (!data.data) data = {data: data};

        var xy = data.data,
            xmin = Infinity,
            ymin = Infinity,
            xmax =-Infinity,
            ymax =-Infinity,
            x = function (x) {
                xmin = x < xmin ? x : xmin;
                xmax = x > xmax ? x : xmax;
                return x;
            },
            y = function (y) {
                ymin = y < ymin ? y : ymin;
                ymax = y > ymax ? y : ymax;
                return y;
            };
        var xydata = [];
        if (isArray(xy[0]) && xy[0].length === 2) {
            xy.forEach(function (xy) {
                xydata.push({x: x(xy[0]), y: y(xy[1])});
            });
        } else {
            var xl = data.xlabel || 'x',
                yl = data.ylabel || 'y';
            xy.forEach(function (xy) {
                xydata.push({x: x(xy[xl]), y: y(xy[yl])});
            });
        }
        data.data = xydata;
        data.xrange = [xmin, xmax];
        data.yrange = [ymin, ymax];
        return data;
    };
