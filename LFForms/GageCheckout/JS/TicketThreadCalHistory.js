$(document).ready(function () {
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js');
  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js');
  $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
  $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
  const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
  $.fn.bootstrapBtn = bootstrapButton;
  $('.Submit').hide();
  $(document).on("onloadlookupfinished", function () {

    $('.cal-date input').each((i, dateField) => $(dateField).val($(dateField).val().split(" ")[0]));
    generateNoteButtons();
  });
});


function generateNoteButtons() {
  $('.notes-button').remove();


  const notes = $(".cal-notes input[type=text]");
  const note_buttons = $(".cal-notes-button input[type=text]");
  const cal_ids = $(".calibration-id input[type=text]");
  note_buttons.each(function (index) {
    const cal_id = cal_ids[index].value;
    const note = notes[index];
    const note_text = $(note).val();

    
    if (note_text.length > 0) {
      const btn_html = `<div class='ui-button notes-button' onclick='showNotes(${cal_id})'><span title='Notes' class='ui-button-icon ui-icon ui-icon-document'></span></div>`
      $(this).replaceWith(btn_html);
    }
    else {
      $(this).addClass("hidden");
    }
  });
}


function showNotes(cal_id_to_show) {
  const cal_ids = $(".calibration-id input[type=text]");
  const notes = $(".cal-notes input[type=text]");

  cal_ids.each(function (index) {
    const cal_id = cal_ids[index].value;
    const note = notes[index].value;
    if (cal_id === cal_id_to_show) {
      $.dialog({
        escapeKey: true,
        title: 'Notes',
        content: note,
      });
    }
  });

}