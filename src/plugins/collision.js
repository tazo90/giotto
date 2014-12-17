
    g.viz.force.plugin(function (force, opts) {
        g._.copyMissing({collidePadding: 0.002, collideBuffer: 0.02}, opts);

        force.collide = function () {
            var snodes = [],
                nodes = force.nodes(),
                paper = force.paper(),
                scalex = paper.scalex,
                scaley = paper.scaley,
                invertx = paper.xAxis().scale().invert,
                inverty = paper.yAxis().scale().invert,
                scale = paper.scale,
                buffer = scale(paper.dim(opts.collideBuffer)),
                padding = paper.dim(opts.collidePadding),
                node;

            for (var i=0; i<nodes.length; ++i) {
                node = nodes[i];
                if (node.radius)
                    snodes.push({
                        x: scalex(node.x),
                        y: scaley(node.y),
                        index: node.index,
                        radius: scale(node.radius + padding)
                    });
            }

            var q = d3.geom.quadtree(snodes);

            for (i=0; i<snodes.length; ++i)
                q.visit(circleCollide(snodes[i], buffer));

            for (i=0; i<snodes.length; ++i) {
                node = snodes[i];
                nodes[node.index].x = invertx(node.x);
                nodes[node.index].y = inverty(node.y);
            }
        };

        function circleCollide (node, buffer) {

            var r = node.radius + buffer,
                nx1 = node.x - r,
                nx2 = node.x + r,
                ny1 = node.y - r,
                ny2 = node.y + r,
                dx, dy, d;

            return function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    dx = node.x - quad.point.x;
                    dy = node.y - quad.point.y;
                    d = Math.sqrt(dx * dx + dy * dy);
                    r = node.radius + quad.point.radius;
                    if (d < r) {
                        d = 0.5 * (r - d) / d;
                        dx *= d;
                        dy *= d;
                        if (node.fixed || quad.point.fixed) {
                            if (node.fixed) {
                                quad.point.x -= 2*dx;
                                quad.point.y -= 2*dy;
                            } else {
                                node.x += 2*dx;
                                node.y += 2*dy;
                            }
                        } else {
                            node.x += dx;
                            node.y += dy;
                            quad.point.x -= dx;
                            quad.point.y -= dy;
                        }
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            };
        }

    });