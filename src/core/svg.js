    //
    //  SVG Paper
    //  ================
    //
    g.paper.addType('svg', function (paper, p) {
        var svg = paper.element().append('svg')
                        .attr('class', 'giotto')
                        .attr('id', 'giotto-paper-' + paper.uid())
                        .attr('width', p.size[0])
                        .attr('height', p.size[1])
                        .attr("viewBox", "0 0 " + p.size[0] + " " + p.size[1]),
            clear = paper.clear,
            components,
            componentMap,
            cidCounter,
            current;

        p.xAxis = d3.svg.axis();
        p.yAxis = [d3.svg.axis(), d3.svg.axis()];

        paper.destroy = function () {
            svg = current = null;
            paper.element().selectAll('*').remove();
            return paper;
        };

        paper.refresh = function (size) {
            if (size) {
                p.size = size;
                svg.attr('width', p.size[0])
                   .attr('height', p.size[1]);
            }
            return paper;
        };

        //  Render the paper by executing all components
        //  If a component id is provided, render only the matching
        //  component
        paper.render = function (cid) {
            if (!arguments.length)
                components.forEach(function (callback) {
                    callback();
                });
            else if (componentMap[cid])
                componentMap[cid]();
        };

        paper.clear = function () {
            components = [];
            componentMap = {};
            cidCounter = 0;
            svg.selectAll('*').remove();
            current = svg.append('g')
                        .attr("transform", "translate(" + p.margin.left + "," + p.margin.top + ")")
                        .attr('class', 'paper');
            //_reset_axis(paper);
            return clear();
        };

        // return the current svg element
        paper.current = function () {
            return current;
        };

        // set the current element to be the root svg element and returns the paper
        paper.root = function () {
            current = svg.select('g.paper');
            return paper;
        };

        // set the current element to be the parent and returns the paper
        paper.parent = function () {
            var node = current.node().parentNode;
            if (node !== svg.node())
                current = d3.select(node);
            return paper;
        };

        paper.on = function (event, callback) {
            current.on(event, function () {
                callback.call(this);
            });
            return paper;
        };

        paper.group = function () {
            current = current.append('g');
            return current;
        };

        paper.circle = function (cx, cy, r) {
            cx = paper.scalex(cx);
            cy = paper.scaley(cy);
            r = paper.scale(r);
            return current.append('circle')
                            .attr('cx', cx)
                            .attr('cy', cy)
                            .attr('r', r);
        };

        paper.rect = function (x, y, width, height, r) {
            var X = paper.scalex(x),
                Y = paper.scaley(y);
            width = paper.scalex(x+width) - X;
            height = paper.scalex(y+height) - Y;
            var rect = current.append('rect')
                                .attr('x', X)
                                .attr('y', Y)
                                .attr('width', width)
                                .attr('height', height);
            if (r) {
                var rx = paper.scalex(r) - paper.scalex(0),
                    ry = paper.scaley(r) - paper.scaley(0);
                rect.attr('rx', rx).attr('ry', rt);
            }
            return rect;
        };

        // Draw a path or an area, data must be an xy array [[x1,y1], [x2, y2], ...]
        paper.path = function (data, opts) {
            opts || (opts = {});
            copyMissing(p.line, opts);
            opts.color = opts.color || paper.pickColor();

            var container = current;

            return paper.addComponent(function () {

                var chart = container.select("path.line"),
                    scalex = paper.scalex,
                    scaley = paper.scaley,
                    line = opts.area ? d3.svg.area() : d3.svg.line();

                line.interpolate(opts.interpolate)
                    .x(function(d) {
                        return scalex(d.x);
                    })
                    .y(function(d) {
                        return scaley(d.y);
                    });

                if (!chart.node())
                    chart = current.append('path')
                                    .attr('class', 'line');

                chart
                    .classed('area', opts.area)
                    .attr('stroke', opts.color)
                    .attr('stroke-width', opts.width)
                    .datum(data)
                    .attr('d', line);

                opts.chart = chart;
                return opts;
            });
        };

        // Draw points
        paper.points = function (data, opts) {
            opts || (opts = {});
            copyMissing(p.point, opts);
            opts.color = opts.color || paper.pickColor();

            var container = current;

            return paper.addComponent(function () {
                var chart = container.select("g.points"),
                    scalex = paper.scalex,
                    scaley = paper.scaley,
                    scale = paper.scale,
                    fill = opts.fill,
                    size = paper.dim(opts.size),
                    points;

                if (fill === true)
                    opts.fill = fill = d3.rgb(opts.color).brighter();

                if (!chart.node()) {
                    chart = container.append("g")
                                    .attr('class', 'points');

                    if (opts.symbol === 'circle')
                        points = chart.selectAll("circle.point")
                                    .data(data)
                                    .enter()
                                    .append("circle")
                                    .attr('class', 'point');
                    else if (opts.symbol === 'square')
                        points = chart.selectAll("rect.point")
                                    .data(data)
                                    .enter()
                                    .append("rect");
                    points.attr('class', 'point');

                } else
                    points = chart.selectAll("circle.point");

                chart.attr('stroke', opts.color)
                        .attr('stroke-width', opts.width);
                if (fill)
                    chart.attr('fill', fill).attr('fill-opacity', opts.fillOpacity);
                else
                    chart.attr('fill', 'none');

                if (opts.symbol === 'circle') {
                    size *= 0.5;
                    points.attr('cx', function (d) {return scalex(d.x);})
                            .attr('cy', function (d) {return scaley(d.y);})
                            .attr('r', function (d) {return s(d.radius, size);})
                            .style("fill", function(d) { return d.fill; });
                } else if (opts.symbol === 'square') {
                    points.attr('x', function (d) {return scalex(d.x) - 0.5*s(d.size, size);})
                            .attr('y', function (d) {return scaley(d.y) - 0.5*s(d.size, size);})
                            .attr('height', function (d) {return  s(d.size, size);})
                            .attr('width', function (d) {return  s(d.size, size);});
                }
                opts.chart = chart;
                return opts;

                function s(v, defo) {
                    return scale(v === undefined ? defo : v);
                }
            });
        };

        // Draw a barchart
        paper.barchart = function (data, opts) {
            opts || (opts = {});
            copyMissing(p.bar, opts);
            opts.color = opts.color || paper.pickColor();

            var container = current;

            return paper.addComponent(function () {

                var scalex = paper.scalex,
                    scaley = paper.scaley,
                    width = opts.width,
                    zero = scaley(0),
                    chart = container.select('g.barchart');

                if (width === 'auto')
                    width = d3.round(0.8*(paper.innerWidth() / data.length));

                if (!chart.node())
                    chart = container.append("g")
                                .attr('class', 'barchart');
                chart.attr('stroke', opts.stroke).attr('fill', opts.color);

                var bar = chart
                        .attr('stroke', opts.stroke)
                        .attr('fill', opts.color)
                        .selectAll(".bar")
                        .data(data)
                        .enter().append("rect")
                        .attr('class', 'bar')
                        .attr("x", function(d) {
                            return scalex(d.x) - width/2;
                        })
                        .attr("y", function(d) {return d.y < 0 ? zero : scaley(d.y); })
                        .attr("height", function(d) { return d.y < 0 ? scaley(d.y) - zero : zero - scaley(d.y); })
                        .attr("width", width);

                if (opts.radius)
                    bar.attr('rx', opts.radius).attr('ry', opts.radius);

                opts.chart = chart;
                return opts;
            });
        };

        paper.drawXaxis = function () {
            var opts = p.xaxis,
                py = opts.position === 'top' ? 0 : paper.innerHeight();
            return _axis(p.xAxis, 'x-axis', 0, py, opts);
        };

        paper.drawYaxis = function () {
            var yaxis = paper.yaxis(),
                opts = yaxis === 1 ? p.yaxis : p.yaxis2,
                px = opts.position === 'left' ? 0 : paper.innerWidth();
            return _axis(paper.yAxis(), 'y-axis-' + yaxis, px, 0, opts);
        };

        paper.setBackground = function (o, background) {
            if (_.isObject(background)) {
                if (background.opacity !== undefined)
                    o.attr('fill-opacity', background.opacity);
                background = background.color;
            }
            if (_.isString(background))
                o.attr('fill', background);

            return paper;
        };

        // Create a gradient element to use by scg elements
        paper.gradient = function (id, color1, color2) {
            var svg = d3.select("body").append("svg"),
                gradient = svg.append('linearGradient')
                            .attr("x1", "0%")
                            .attr("x2", "100%")
                            .attr("y1", "0%")
                            .attr("y2", "100%")
                            .attr("id", id)
                            .attr("gradientUnits", "userSpaceOnUse");
            gradient
                .append("stop")
                .attr("offset", "0")
                .attr("stop-color", color1);

            gradient
                .append("stop")
                .attr("offset", "0.5")
                .attr("stop-color", color2);
        };

        paper.encode = function () {
            return btoa(unescape(encodeURIComponent(
                svg.attr("version", "1.1")
                    .attr("xmlns", "http://www.w3.org/2000/svg")
                    .node().parentNode.innerHTML)));
        };

        paper.downloadSVG = function (e) {
            var data = "data:image/svg+xml;charset=utf-8;base64," + paper.encode();
            d3.select(e.target).attr("href", data);
        };

        paper.downloadPNG = function (e) {
            if (!g.cloudConvertApiKey)
                return;

            var params = {
                apikey: g.cloudConvertApiKey,
                inputformat: 'svg',
                outputformat: 'png'
            };

            var blob = new Blob(['base64,',paper.encode()], {type : 'image/svg+xml;charset=utf-8'});

            d3.xhr('https://api.cloudconvert.org/process?' + encodeObject(params))
                .header('content-type', 'multipart/form-data')
                .post(submit);

            function submit(_, request) {
                if (!request || request.status !== 200)
                    return;
                var data = JSON.parse(request.responseText);
                d3.xhr(data.url)
                    .post(encodeObject({
                        input: 'upload',
                        file: blob
                    }, 'multipart/form-data'), function (r, request) {
                        if (!request || request.status !== 200)
                            return;
                        data = JSON.parse(request.responseText);
                        wait_for_data(data);
                    });
            }

            function wait_for_data (data) {
                d3.xhr(data.url, function (r, request) {
                    if (!request || request.status !== 200)
                        return;
                    data = JSON.parse(request.responseText);
                    if (data.step === 'finished')
                        download(data.output);
                    else if (data.step === 'error')
                        error(data);
                    else
                        wait_for_data(data);
                });
            }

            function error (data) {

            }

            function download(data) {
                d3.select(e.target).attr("href", data.url + '?inline');
            }
        };

        // LOW LEVEL FUNCTIONS - MAYBE THEY SHOULD BE PRIVATE?

        // Add a new component to the paper and return the component id
        paper.addComponent = function (callback) {
            var cid = ++cidCounter;
            components.push(callback);
            componentMap[cid] = callback;
            var o = callback();
            if (!o) o = {};
            o.cid = cid;
            return o;
        };

        paper.removeComponent = function (cid) {
            if (!cid) return;
            var callback = componentMap[cid];
            if (callback) {
                delete componentMap[cid];
                var index = components.indexOf(callback);
                if (index > -1)
                    return components.splice(index, 1)[0];
            }
        };

        // PRIVATE FUNCTIONS

        function _axis(axis, cn, px, py, opts) {
            var font = opts.font,
                g = paper.root().current().select('g.' + cn);
            if (!g.node()) {
                g = _font(paper.current().append('g')
                            .attr("class", "axis " + cn)
                            .attr("transform", "translate(" + px + "," + py + ")")
                            .attr('stroke', opts.color), opts.font);
                paper.addComponent(function () {
                    g.call(axis);
                });
            }
        }

        function _font(element, opts) {
            var font = p.font;
            opts || (opts = {});
            return element.style({
                'font-size': opts.size || font.size,
                'font-weight': opts.weight || font.weight,
                'font-style': opts.style || font.style,
                'font-family': opts.family || font.family,
                'font-variant': opts.variant || font.variant
            });
        }
    });
