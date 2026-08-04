$(function() {

  $('.Submit').hide();
  $('.Submit').on("click", function (e) {
    submitForm(e);
  });

  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function() {

    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();
    $(document).prop('title', 'Thread Member Inventory');
    $('#q0').append("<div class='hidden' id='popUpDiv'></div>");

  }).fail(function() {
    console.error('Failed to load required scripts');
  });

  $(document).on("onloadlookupfinished", function () {
    $('.Submit').hide();
    const sitename = $.cookie('site_name');
    if (sitename !== null) {
      $('.site-name select').val(sitename).trigger("change");
    }
    generateGoBackButtons();
    $('.thread-member-table').show();
  });

  $(document).on('lookupcomplete', function () {

    if ($('.pg input').val() === '999') {
      $('.pg input').val(1).trigger("change");
    }

    generateFilterRow();
    generateTableButtons(".edit-id-col", "edit-button", "ui-icon-pencil", "Edit Thread Member", "editThreadMember");
    generateTableButtons(".decrement-member-col", "decrement-button", "ui-icon-circle-triangle-s", "Decrement On-Hand Quantity", "decrementThreadMember");
    appendPagination();

    $('.thread-member-table').show();

  });

  $(document).on('change', '.site-name select', function () {
    const sitename = $('.site-name select').val();
    $.cookie('site_name', sitename, {expires: 365, path: '/'});
  });

  $(document).on('change', '.update-thread-member-onhand', function () {
    const threadMemberID = Number($('.update-thread-member-id input').val());
    if (threadMemberID > 0) {
      updateThreadMemberOnHand(threadMemberID);
    }
  })

});


function addThreadMember() {
  $('.action-choice input').val(1);
  $('.member-add-id input').val(1).trigger("change");
  $('.Submit').show();
}


function appendPagination() {

  const current_page = Number($('.pg input').val());
  if (current_page === 999) {
    return;
  }

  const row_count = $('.thread-member-table table tbody tr').length;

  if (row_count > 0) {
    $('#thread-member-pagination').remove();
    if ((current_page === 1) && (row_count < 25)) {
      $('.thread-member-table table').parent().append("<div id='thread-member-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>");
      return;
    }
    if ((current_page === 1) && (row_count === 25)) {
      $('.thread-member-table table').parent().append("<div id='thread-member-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled'>&laquo;</a></li><li><a class='page-link prev isDisabled'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count === 25)) {
      $('.thread-member-table table').parent().append("<div id='thread-member-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next' onclick='callNextPage();' href='javascript:void(0);'>&rsaquo;</a></li></ul></div>")
      return;
    }
    if ((current_page > 1) && (row_count < 25)) {
      $('.thread-member-table table').parent().append("<div id='thread-member-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev' onclick='resetPageNumber();' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev' onclick='callPrevPage();' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
    }
  } else {
    $('#thread-member-pagination').remove();
    $('.thread-member-table table').parent().append("<div id='thread-member-pagination' class='pagination light-theme simple-pagination'><ul><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&laquo;</a></li><li><a class='page-link prev isDisabled' href='javascript:void(0);'>&lsaquo;</a></li><li><a class='page-link next isDisabled'>&rsaquo;</a></li></ul></div>")
  }
}


function callGoBack() {
  $('.action-choice input').val(0);
  $('.member-add-id input').val(0).trigger("change");
  $('.member-edit-id input').val(0).trigger("change");
  $('.Submit').hide();
}


function callNextPage() {
  $('.pg').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  $('.pg input').val(current_page + 1).trigger("change");
}


function callPrevPage() {
  $('.pg').hide();
  removeAppendedFields();
  let current_page = Number($('.pg input').val());
  if (current_page === 1) {
    return;
  }
  $('.pg input').val(current_page - 1).trigger("change");
}


function decrementThreadMember(threadMemberID) {
  const domain = document.location.hostname;
  const url_root = document.location.protocol + "//" + domain + "/Forms/";
  let decrement_onhand_url = url_root + "RMS-GAGE-DecrementThreadMemberOnHand?tmid=" + threadMemberID;
  $("#popUpDiv").html("<iframe id='print-iframe' name='print-iframe' src='" + decrement_onhand_url + "' />");

  setTimeout(function () {
    const updateThreadMemberIdField = $('.update-thread-member-id input');
    if (updateThreadMemberIdField.length > 0) {
      updateThreadMemberIdField.val(threadMemberID).trigger('change');
    }
  }, 2000);

}


function editThreadMember(threadMemberID) {
  $('.action-choice input').val(2);
  $('.member-edit-id input').val(threadMemberID).trigger("change");
  $('.Submit').show();
}


function filterTicketTable() {

  if ($('#filterRow').length === 0) {
    return;
  }

  $('.thread-member-table').hide();
  removeAppendedFields();

  const threadSizeFilterVal = $('#cboFilter_ThreadSize').val();
  const threadTypeFilterVal = $('#cboFilter_ThreadType').val();


  $('.ftsize input').val(threadSizeFilterVal);
  $('.fttype input').val(threadTypeFilterVal);

  $('.thread-member-table').hide();
  $('.pg input').val(1).trigger("change");

}


function generateFilterRow() {

  if ($('#filterRow').length === 0) {

    const filter_row = "<TR id='filterRow'><TH/><TH/><TH><select id='cboFilter_ThreadSize'/></TH><TH><select id='cboFilter_ThreadType'/></TH><TH/><TH/><TH/><TH/><TH/>"
    $('.thread-member-table table thead').append(filter_row);
    $("#cboFilter_ThreadSize").on("change", function () {
      filterTicketTable();
    });
    $("#cboFilter_ThreadType").on("change", function () {
      filterTicketTable();
    });
    

    $("#cboFilter_ThreadSize").on("dblclick", function () {
      $("#cboFilter_ThreadSize").val(null).trigger("change");
    });
    $("#cboFilter_ThreadType").on("dblclick", function () {
      $("#cboFilter_ThreadType").val(null).trigger("change");
    });
  }

  if (($(".thread-member-size-cbo select option").length > 0) && ($('#cboFilter_ThreadSize option').length < 2)) {
    $("#cboFilter_ThreadSize").html($(".thread-member-size-cbo select").html());
  }

  if (($(".thread-member-type-cbo select option").length > 0) && ($('#cboFilter_ThreadType option').length < 2)) {
    $("#cboFilter_ThreadType").html($(".thread-member-type-cbo select").html());
  }

  if (isMetrologyUser()) {
    if ($('.add-button').length === 0) {
      const add_button = '<div class="ui-button add-button" id="add-thread-member" onclick="addThreadMember()"><span title="Add Thread Member" class="ui-button-icon ui-icon ui-icon-plusthick"></span>Add Thread Member</div>'
      $(add_button).insertBefore('.thread-member-table table');
    }
  }

  if ((($('.ftsize input').val() !== null) && ($('.ftsize input').val().length > 0)) && (($('#cboFilter_ThreadSize').val() === null) || ($('#cboFilter_ThreadSize').val() === ''))) {
    $('#cboFilter_ThreadSize').val($('.ftsize input').val());
  }

  if ((($('.fttype input').val() !== null) && ($('.fttype input').val().length > 0)) && (($('#cboFilter_ThreadType').val() === null) || ($('#cboFilter_ThreadType').val() === ''))) {
    $('#cboFilter_ThreadType').val($('.fttype input').val());
  }

}


function generateGoBackButtons() {
  const goback_buttons = $(".goback_activate");
  goback_buttons.each(function () {
    $(this).parent().append("<div id='go-back' class='ui-button ui-corner-all ui-widget' onclick='callGoBack()'><span class='ui-icon ui-icon-arrowreturnthick-1-w'></span>Go Back</div>");
  });
  $(".goback_activate").remove();
}


function generateTableButtons(buttonSelector, buttonClass, buttonImageClass, buttonTitle, buttonFunction) {
  const selectionString = buttonSelector + " input[type=text]";
  const buttons = $(selectionString);
  buttons.each(function () {
    const btn_value = $(this).val();
    const btn_html = `<div class='table-button ui-button ${buttonClass}' onclick='${buttonFunction}(${btn_value})'><span title='${buttonTitle}' class='ui-button-icon ui-icon ${buttonImageClass}'/></div>`

    const has_button = $(this).parent().find(`.${buttonClass}`).length;
    if (has_button === 0) {
      $(this).parent().append(btn_html);
    }
  });
}


function isMetrologyUser() {
  return Number($('.user-isactive input').val()) === 1;
}


function removeAppendedFields() {
  $('#thread-member-pagination').remove();
  $('.table-button').remove();
}


function resetPageNumber() {
  $('.thread-member-table').hide();
  removeAppendedFields();
  $('.pg input').val(1).trigger("change");
}


function submitForm() {

  // const siteID = Number($('.site-id input').val());
  // const activateSubmitEmployeeNumber = $('.activate-employee-number input');
  // const activateSubmitEmployeeName = $('.activate-employee-name input');
  //
  // const crActivateEmployeeNumber = $('.cr-act-employee-number input');
  // const crActivateEmployeeName = $('.cr-act-employee-name input');
  //
  // const anokaActivateEmployeeNumber = $('.ank-act-employee-number input');
  // const anokaActivateEmployeeName = $('.ank-act-employee-name input');
  //
  // if (siteID === 1) {
  //   activateSubmitEmployeeNumber.val(crActivateEmployeeNumber.val());
  //   activateSubmitEmployeeName.val(crActivateEmployeeName.val());
  // }
  // if (siteID === 2) {
  //   activateSubmitEmployeeNumber.val(anokaActivateEmployeeNumber.val());
  //   activateSubmitEmployeeName.val(anokaActivateEmployeeName.val());
  // }
  // $('.print-ticket-id input').val($('.activate-guid input').val());
}


function updateThreadMemberOnHand(threadMemberID){
  let updated_onhand = Number($('.update-thread-member-onhand input').val());
  let table_rows = $('.thread-member-table table tbody tr')
  table_rows.each(function () {
    let row_id = $(this).find('.edit-id-col input[type=text]').val();

    if (Number(row_id) === Number(threadMemberID)) {
      let onhand_qty_field = $(this).find('.on-hand-qty-col input[type=text]');
      let onhand_qty = Number(onhand_qty_field.val());
      if (onhand_qty > updated_onhand) {
        onhand_qty_field.val(updated_onhand);
      }
    }
  });

}
