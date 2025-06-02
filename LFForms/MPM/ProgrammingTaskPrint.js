
$(document).ready(function () {
  
  $('.Submit').hide();
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');

  $(document).on("onloadlookupfinished", function () {
    var taskName = $('.task-name input').val();
    $('#form-title-wrap h1').text(`Programming Task ${taskName}`)
    generateTextAreaDivs();
    var taskID = $('.tid input').val();
    if ((taskID != '') && (taskID != '0')) {
      $('#task-history').append(`<iframe id='task-history-iframe' name='task-history-iframe' src='http://rmslf/Forms/MPM-ProgamTaskHistory?tid=${taskID}' height='500' width='100%'/>`);
    }
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
