$(function () {

  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
  ).done(function () {

    $(document).prop('title', 'Task Maintenance');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();

  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    if (typeof $.cookie === 'function') {
      $.cookie('site_name', sitename, filterCookieOptions);
    }
  });

  $(document).on('lookupcomplete', function () {

  });

  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
  });

});
