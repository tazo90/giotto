
    gexamples.piecharts = {
        height: '80%',

        // Rightclick menu
        contextmenu: [{
            label: 'Save Image As',
            callback: function (chart) {
                chart.download();
            }
        }],

        data: [['Italy', 42772],
               ['France', 50764],
               ['Spain', 33397],
               ['USA', 19187],
               ['Argentina', 15473],
               ['China', 13200],
               ['Australia', 11180],
               ['Chile', 10463],
               ['Germany', 9132],
               ['South Africa', 9725],
               ['Portugal', 5610],
               ['New Zealand', 2350],
               ['Rest of World', 63776]],

        // Callback for angular directive
        angular: function (chart, opts) {

            opts.scope.$on('formFieldChange', function (e, model) {
                var value = model.form[model.field];

                if (model.field === 'type') {
                    // rebuild paper
                    opts.type = value;
                    chart.paper(true);
                    chart.resume();
                } else if (model.field === 'innerRadius') {
                    opts.innerRadius = value;
                    chart.resume();
                } else if (model.field === 'cornerRadius') {
                    opts.cornerRadius = value;
                    chart.resume();
                } else if (model.field === 'padding') {
                    opts.padAngle = value;
                    chart.resume();
                }

            });
        }
    };