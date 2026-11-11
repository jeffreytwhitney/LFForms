$(function () {
  const lfUserName = $('.lf-user-name input').val();
  $('.network-user-name input').val(lfUserName.toUpperCase().slice(lfUserName.lastIndexOf('\\') + 1)).trigger("change");

  $('.Submit').hide();

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $(document).prop('title', 'Metrology Machine Types');
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict(); // return $.fn.button to previously assigned value

  }).fail(function () {
    console.error('Failed to load required scripts');
  });


  $(document).on('change', '.edit-is-active-value input', function () {
    const isActive = $('.edit-is-active-value input').val();
    console.log(`Setting edit-machine-is-active radio to ${isActive}`);
    $(`.edit-machine-is-active input[type='radio'][value='${isActive}']`).prop("checked", true);
  });


  $(document).on('lookupcomplete', function () {
    generateTableButtons(".edit-button-col", "ui-icon-pencil", "Edit Machine Type", "callEditMachineType");
    generateGoBackButtons();

    if (isAdminUser()) {
      if ($('.add-button').length === 0) {
        const add_button = `<div class="ui-button add-button" onclick="callAddMachineType()"><span title="Add Machine Type" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Machine Type</div>`;
        $(add_button).insertBefore('.machine-type-table table');
      }
    }

  });

  $(document).on("onloadlookupfinished", function () {
    $('.network-user-name input').trigger("change");
  });

});




function callAddMachineType() {
  $(`.action-choice input[type='radio'][value='1']`).prop("checked", true);
  $('.add-id input').val(1).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}


function callEditMachineType(MachineID) {
  $(`.action-choice input[type='radio'][value='2']`).prop("checked", true);
  $('.edit-id input').val(MachineID).trigger("change");
  if (isAdminUser()) {
    $('.Submit').show();
  }
}



function callGoBack() {
  $(".add-id input").val(0).trigger("change");
  $(".edit-id input").val(0).trigger("change");
  $('.Submit').hide();
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".gobackbutton").remove();
}


function generateTableButtons(buttonSelector, buttonClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonClass}'/></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}



function isAdminUser() {
  return $('.user-isadmin input').val() === '1';

}

