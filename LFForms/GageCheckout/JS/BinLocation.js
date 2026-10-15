$(function () {
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $(document).prop('title', 'Bin Maintenance');
    $.fn.bootstrapBtn = $.fn.button.noConflict();
  }).fail(function () {
    console.error('Failed to load required scripts - Bin Maintenance');
  });

  $('.Submit').hide();


  $('#q2 .cf-table_parent').prepend("<fieldset id='Field999' class='radio-checkbox-fieldset filter-checkboxes'><span class='choice'><input name='Field999' id='Field999-0' type='checkbox' value='IncludeInactiveLocations'><label class='form-option-label lbl-inactive' for='Field999-0'>Include Inactive Locations</label></span></fieldset>");

  $(document).on('change', '.edit-is-active-value input', function () {
    const isActive = $('.edit-is-active-value input').val();
    $(`.edit-is-active-rdo input[type='radio'][value='${isActive}']`).prop('checked', true);
  });

  $(document).on('change', ".edit-is-active-rdo input[type='radio']", function () {
    $('.edit-is-active-value input').val($(this).val());
  });

  $(document).on('change', '#Field999-0', function () {
    if ($("#Field999-0").is(":checked")) {
      $('.incinactive input').val(1);
    }
    else {
      $('.incinactive input').val(0);
    }

    $('.bin-location-table').hide();
    $('.pg input').val(1).trigger("change");
  });



  $(document).on("onloadlookupfinished", function () {
    generateAddButton();
    generateGoBackButtons();
    $(".filter-checkboxes input[type='checkbox']").on("change", function () { filterBinTable(); });
    $('#txtFilterBinName').on("keyup", function () { this.value = this.value.toLocaleUpperCase(); });
    $('.add-bin-name input').on("keyup", function () { this.value = this.value.toLocaleUpperCase(); });
    $('.bin-location-table').show();
  });

  $(document).on('lookupcomplete', function () {
    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }
    generateEditButtons();
    appendPagination();
    $('.bin-location-table').show();
  });

});


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) { return; }

  const row_count = getRowCount();

  if (row_count > 0) {
    $('#bin-location-table-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.bin-location-table table').parent().append("<div id='bin-location-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.bin-location-table table').parent().append("<div id='bin-location-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.bin-location-table table').parent().append("<div id='bin-location-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.bin-location-table table').parent().append("<div id='bin-location-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  }
  else {
    $('#bin-location-table-pagination').remove();
    $('.bin-location-table table').parent().append("<div id='bin-location-table-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
  }
}


function callAddBinLocation() {
  $("#Field10-1").prop("checked", true).trigger("change");``
  $(".add-location-id input").val(1).trigger("change");
  $('.Submit').show();
}


function callEditBinLocation(bin_id) {
  $("#Field10-0").prop("checked", true).trigger("change");
  $(".edit-location-id input").val(bin_id).trigger("change");
  $('.Submit').show();
}


function callPrevPage() {
  $('.bin-location-table').hide();
  $('.table-button').remove();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function callNextPage() {
  $('.bin-location-table').hide();
  $('.table-button').remove();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_user_active = Number($(".user-isactive input").val());

  return is_user_active === 1
    && typeof employee_number === 'string'
    && employee_number.trim() !== '';
}


function generateAddButton() {
  const add_buttons = $(".addbutton");
  const is_admin = checkPermissions();

  add_buttons.each(function () {
    if (is_admin) {
      $(this).replaceWith("<input class='return' style='visibilty:visible' type='button' value='Add Bin' onclick='callAddBinLocation()' />");
    }
    else {
      $(this).replaceWith("");
    }
  });

}


function generateEditButtons() {
  const is_admin = checkPermissions();
  $('.table-button').remove();
  const edit_buttons = $(".edit-button input[type=text]");
  edit_buttons.each(function () {
    const btn_value = $(this).val();
    if (is_admin) {
      $(this).parent().append("<input class='table-button' type='button' value='Edit' onclick='callEditBinLocation(" + btn_value + ")' />");
    }

  });
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function getRowCount() {
  return $('.bin-location-table table tbody tr').length;
}


function goBack() {
  $(".edit-location-id input").val("0").trigger("change"); //edit
  $(".add-location-id input").val("0").trigger("change"); //add
  $('.Submit').hide();
}


function resetPageNumber() {
  $('.bin-location-table').hide();
  $('.table-button').remove();
  $('.pg input').val(1).trigger("change");
}




