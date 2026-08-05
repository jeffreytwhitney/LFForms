$(function () {
  $('.Submit').hide();


  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Gage Requests');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  }).fail(function () {
    console.error('Failed to load required scripts');
  });


  $('.Submit').on("click", function (e) { submitForm(e); });

  $(document).on("onloadlookupfinished", function () {
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    generateGoBackButtons();

    if ($('.add-button').length === 0) {
      const add_button = '<div class="add-button ui-button ui-corner-all ui-widget" onclick="callAddGage()"><span title="Request Gage" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Request Gage</div><div><br></div>'
      $(add_button).insertBefore('.gage-request-table table');
    }

  });

  $(document).on('lookupcomplete', function (e) {

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, { expires: 365, path: '/' });
  });

  $(document).on('change', '.cr-employee-name input', function () {
    const crEmployeeNumberValue = $('.cr-employee-number input').val();
    const crEmployeeNameValue = $('.cr-employee-name input').val();

    $('.submit-employee-number input').val(crEmployeeNumberValue);
    $('.submit-employee-name input').val(crEmployeeNameValue);
  });

  $(document).on('change', '.anoka-employee-name input', function () {
    const anokaEmployeeNumberValue = $('.anoka-employee-number input').val();
    const anokaEmployeeNameValue = $('.anoka-employee-name input').val();

    $('.submit-employee-number input').val(anokaEmployeeNumberValue);
    $('.submit-employee-name input').val(anokaEmployeeNameValue);
  });

});


function callAddGage() {
  $('.add-id input').val(1).trigger("change");
  $('.Submit').show();
}


function callGoBack() {
  $('.add-id input').val(0).trigger("change");
  $('.Submit').hide();
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function submitForm() {
  const siteID = $('.site-id input').val();
  const crEmployeeNumber = $('.cr-employee-number input').val();
  const anokaEmployeeNumber = $('.anoka-employee-number input').val();
  const crEmployeeName = $('.cr-employee-name input').val();
  const anokaEmployeeName = $('.anoka-employee-name input').val();

  if (siteID === '1') {
    $('.submit-employee-number input').val(crEmployeeNumber);
    $('.submit-employee-name input').val(crEmployeeName);
  }

  if (siteID === '2') {
    $('.submit-employee-number input').val(anokaEmployeeNumber);
    $('.submit-employee-name input').val(anokaEmployeeName);
  } 

  
}
