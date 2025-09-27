
$(document).ready(function () {
  $(document).prop('title', 'Edit Service Ticket');
  $('.Submit').hide();
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  
  $(document).on("onloadlookupfinished", function () {
    var ticketNumber = $('.ticket-number input').val();
    $('#form-title-wrap h1').text(`Service Ticket ${ticketNumber}`)
    generateTextAreaDivs();
    parent.postMessage("printme", "*");

  

  });

  $(document).on('lookupcomplete', function (e) {

  });
});


function generateTextAreaDivs() {
  $('.textarea-div').remove();
  $('textarea').each(function () {
    let textarea_text = $(this).val();
    $(this).parent().html('<div class="textarea-div">' + textarea_text + '</div>');
  });

}
