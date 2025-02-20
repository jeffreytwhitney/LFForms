
$(document).ready(function () {
  $('.Submit').click(function (e) { validateForm(e); });
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').hide();
  $(document).prop('title', 'Bin Maintenance');
  $('#myElement').removeAttr('style');
  $('#q2').prepend("<fieldset id='Field25' class='radio-checkbox-fieldset filter-checkboxes'><span class='choice'><input name='Field25' id='Field25-0' type='checkbox' value='IncludeInactiveBins'><label class='form-option-label' for='Field25-0'>Include Inactive Bins</label></span></fieldset>");

  $('.edit-bin-isactive-value input').change(function () {
    $('.edit-bin-isactive-combo select').val(Number($('.edit-bin-isactive-value input').val()));
  });
  $('.edit-bin-isactive-combo select').change(function () {
    $('.edit-bin-isactive-value input').val(Number($('.edit-bin-isactive-combo select').val()));
  });
  $('.existing-bin-name-id input').change(function () {
    validateForm();
  });


  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();

    $(".filter-checkboxes input[type='checkbox']").on("change", function () { filterBinTable(); });
    $('.bin-table').show();

  });

  $(document).on('lookupcomplete', function (e) {
    if ($('.pg input').val() == '999') {
      $('.pg input').val(1).change();
    }
    generateEditButtons();
    changeNumericToYesNo();
    appendPagination();

    $('.bin-table').show();
  });
  
});


function appendPagination() {

  var current_page = Number($('.pg input').val());
  if (current_page == 999) { return; }

  var row_count = getBinRowCount();

  if (row_count > 0) {
    $('#bin-table-pagination').remove();
    if ((current_page == 1) && (row_count < 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>");
      return;
    }
    if ((current_page == 1) && (row_count == 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count == 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>›</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.bin-table table').parent().append("<div id='bin-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);''>‹</a></li><li><a class='page-link next isDisabled'>›</a></li></ul></div>")
      return;
    }
  }
}


function callAddBin() {

  $("#Field9-1").prop("checked", true).change();
  $(".add-bin-id input").val(1).change();
  $('.Submit').show();

}


function callEditBin(bin_id) {
  $("#Field9-0").prop("checked", true).change();
  $(".edit-bin-id input").val(bin_id).change();
  $('.Submit').show();
}


function callPrevPage() {
  $('.bin-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  if (current_page == 1) {
    return;
  }
  $('.pg input').val(current_page - 1).change();
}


function callNextPage() {
  $('.bin-table').hide();
  removeAppendedFields();
  current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).change();
}


function changeNumericToYesNo() {

  var isactive = $("[id^='Field14']");
  isactive.each(function (index) {
    var isactive_value = $(this).val();
    if ((isactive_value === '1') || (isactive_value === 'Yes')) {
      $(this).val('Yes');
    }
    else {
      $(this).val('No');
    }
  });
}


function checkPermissions() {

  var employee_number = $(".user-employee-number input").val();
  var is_user_active = Number($(".user-isactive input").val());
  var return_val = true;

  if (is_user_active == 0) {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val;
}


function filterBinTable() {


  if ($("#Field25-0").is(":checked")) {
    $('.incinactive input').val(1);
  }
  else {
    $('.incinactive input').val(0);
  }
  $('.bin-table').hide();
  $('.pg input').val(1).change();

}


function generateAddButton() {
  var add_buttons = $(".addbutton");
  var is_admin = checkPermissions();

  add_buttons.each(function (index) {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Bin' onclick='callAddBin()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  var is_admin = checkPermissions();
  $('.table-button').remove();
  var edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function (index) {
    var btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditBin(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function getBinRowCount() {
  var row_count = $('.bin-table table tbody tr').length;
  return row_count;
}


function goBack() {
  $(".edit-bin-id input").val("").change(); //edit
  $(".add-bin-id input").val("").change(); //add
  $('.Submit').hide();
}


function removeAppendedFields() {
  $('#tasklist-pagination').remove();
  $('.table-button').remove();
}


function resetPageNumber() {
  $('.bin-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).change();
}


function resetValidationErrors() {
  $('.add-pins-bins-table-new-bin-number input').removeClass('parsley-error');

  $('#preexisting-bin-error').remove();
}


function validateForm(e) {

  var isValid = true;
  resetValidationErrors();

  var existingBinNameID = $('.existing-bin-name-id input').val();
  console.log(`ExistingBinID:${existingBinNameID}`);
  var binNameField = $('.add-bin-name input');

  if (existingBinNameID.length > 0) {
    binNameField.parent().find('#preexisting-bin-error').remove();
    binNameField.parent().append("<ul id='preexisting-bin-error' role='alert' class='parsley-errors-list filled'><li class='parsley-required'>There is already a bin with this name.</li></ul>");
    binNameField.addClass('parsley-error');
    isValid = false;
  }
  if (isValid == false) {
    if (arguments.length === 1) {
      e.preventDefault();
    }
  }

}
