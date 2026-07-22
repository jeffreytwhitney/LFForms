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

    $(document).on("lookupcomplete", function () {
      $('.thread-nominal').remove();
      const missingThreadDetailId = $('.missing-thread-detail-id input').val();
      
      if (missingThreadDetailId.length > 0) {
        const threadTypeID = $('.thread-type-id input').val();
        const goDiameterField = $('.go-pitch-diameter input[type="text"]');
        const noGoDiameterField = $('.nogo-pitch-diameter input[type="text"]');
        const majorDiameterField = $('.major-pitch-diameter input[type="text"]');

        const nominalGoDiameterVal = $('.nominal-go-pitch-diameter input[type="text"]').val();
        const nominalNoGoDiameterVal = $('.nominal-nogo-pitch-diameter input[type="text"]').val();
        const nominalMajorDiameterVal = $('.nominal-major-diameter input[type="text"]').val();

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
  const $recall_buttons = $(".recall-button input[type=text]");
  $recall_buttons.each(function () {
    const $btn_value = $(this).val();
    $(this).parent().append("<input class='return' type='button' value='Recall' onclick='callRecall(" + $btn_value + ")' />");
  });
}


function checkPermissions() {

  const employee_number = $(".user-employee-number input").val();
  const is_active_user = $(".user-isactive input").val();
  let return_val = true;

  if (is_active_user !== '1') {
    return_val = false;
  }

  if (employee_number === '') {
    return_val = false;
  }

  return return_val

}


function callRecall(ticket_id) {
  const has_permissions = checkPermissions();
  if (has_permissions) {
    $(".missing-thread-detail-id input").val(ticket_id).trigger("change");
    $('.Submit').show();
  }
  else {
    alert("Sorry, you do not have permissions to do this.");
  }
}


function generateGoBackButtons() {
  const $goback_buttons = $(".gobackbutton");
  $goback_buttons.each(function () {
    $(this).replaceWith("<input class='return' type='button' value='Go Back' onclick='goBack()' />");
  });
}


function goBack() {
  $(".missing-thread-detail-id input").val("").trigger("change");
  $('.Submit').hide();
}
