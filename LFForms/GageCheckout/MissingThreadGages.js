$(document).ready(
  function () {
    $('.Submit').hide();
    $(document).prop('title', 'Missing Thread Gages');

    $(document).on("onloadlookupfinished", function () {
      $('.Submit').hide();

      generateRecallButtons();
      generateGoBackButtons();
      $('.gage-table').css("visibility", "visible");

    });

    $(document).on("lookupcomplete", function (e) {
      $('.thread-nominal').remove();
      var missingThreadDetailId = $('.missing-thread-detail-id input').val();
      
      if (missingThreadDetailId.length > 0) {
        let threadTypeID = $('.thread-type-id input').val();
        let goDiameterField = $('.go-pitch-diameter input[type="text"]');
        let noGoDiameterField = $('.nogo-pitch-diameter input[type="text"]');
        let majorDiameterField = $('.major-pitch-diameter input[type="text"]');

        let nominalGoDiameterVal = $('.nominal-go-pitch-diameter input[type="text"]').val();
        let nominalNoGoDiameterVal = $('.nominal-nogo-pitch-diameter input[type="text"]').val();
        let nominalMajorDiameterVal = $('.nominal-major-diameter input[type="text"]').val();

        goDiameterField.parent().append(`<div class="thread-nominal">Nominal: ${nominalGoDiameterVal}</div>`);
        noGoDiameterField.parent().append(`<div class="thread-nominal">Nominal: ${nominalNoGoDiameterVal}</div>`);
        majorDiameterField.parent().append(`<div class="thread-nominal">Nominal: ${nominalMajorDiameterVal}</div>`);


        if (threadTypeID === '1') {
          $('#Field26-1').parent().css("display", "none");
        }
      }
      
    });
  });


function generateRecallButtons() {
  var $recall_buttons = $(".recall-button input[type=text]");
  $recall_buttons.each(function (index) {
    var $btn_value = $(this).val();
    $(this).parent().append("<input class='return' type='button' value='Recall' onclick='callRecall(" + $btn_value + ")' />");
  });
};


function checkPermissions() {

  var employee_number = $(".user-employee-number input").val();
  var is_active_user = $(".user-isactive input").val();
  var return_val = true;

  if (is_active_user !== '1') {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val

};


function callRecall(ticket_id) {
  var has_permissions = checkPermissions();
  if (has_permissions) {
    $(".missing-thread-detail-id input").val(ticket_id).change();
    $('.Submit').show();
  }
  else {
    alert("Sorry, you do not have permissions to do this.");
  }
};


function generateGoBackButtons() {
  var $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function (index) {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function goBack() {
  $(".missing-thread-detail-id input").val("").change();
  $('.Submit').hide();
}
