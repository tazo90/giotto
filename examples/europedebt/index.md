title: Central Government Debt in Europe
description: Central Government Debt in Europe in 2012 and 2013. This example shows how GiottoJS handles several labels without overlapping them.
keywords: d3js, visualization, giottojs, javascript, svg, canvas, debt, europe, piechart
image: $site_url/examples/europedebt.png
date: 9 January 2015
author: Luca Sbardella

<div class="container-fluid">
  <div class="row">
    <div class="col-sm-10">
    <div data-options='gexamples.europedebt' class="center-block" giotto-chart></div>
    <p class="text-right small">Source: <a href="http://ec.europa.eu/eurostat" target="self">Eurostat</a></p>
    </div>
    <div class="col-sm-2 small">
      $html_type_form
      <p>Right click on the chart for additional options</p>
    </div>
  </div>
</div>

Central Government Debt in Europe in 2012 and 2013. This example shows how GiottoJS handles several labels without overlapping them. In addition, a ``custom`` drawing is added in the center of the pie chart displaying the total debt, <strong>almost 10 trillion euros</strong>!
Germany is the only big European country which decreased its debt in 2013 from the 2012 level. Italy is the biggest borrower, the UK a close second.

Html:

    <div data-options='gexamples.europedebt' giotto-chart></div>