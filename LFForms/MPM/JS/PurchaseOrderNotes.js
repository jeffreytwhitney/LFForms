/*!
 File: PurchaseOrderNotes.js
 Purpose: Enhances the Purchase Order Notes view with a double‑click "quick view" modal for long notes and
          loads UI dependencies required by the page.

 Behavior:
 - On DOM ready:
   - Dynamically loads scripts (jquery-cookie, jquery-confirm) and styles (jQuery UI theme,
     simplePagination, jquery-confirm) from public CDNs.
   - Resolves a potential Bootstrap $.fn.button conflict and exposes it as $.fn.bootstrapBtn.
   - Hides elements with the class ".Submit".
 - Registers a delegated double-click handler on ".note-text .cf-field":
   - Locates a descendant <textarea>, reads its current value, and shows it in a modal dialog
     using jquery-confirm (width: 800px, non-Bootstrap theme).

 Expected markup:
   <div class="note-text">
     <div class="cf-field">
       <textarea>Note text...</textarea>
     </div>
   </div>

 Dependencies loaded (via CDN):
 - jquery-cookie v1.4.1 (https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js)
 - jquery-confirm v3.3.2 JS/CSS (https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/)
 - jQuery UI 1.13.3 Smoothness theme CSS
 - simplePagination.js v1.6 CSS

 Assumptions:
 - jQuery is already present on the page.
 - Bootstrap is present if $.fn.button.noConflict() is used; otherwise this call would fail.
 - The note text resides within a <textarea> inside ".note-text .cf-field".
 */

$(function () {
  $.when(
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js'),
    $.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js')
  ).done(function () {
    $("head").append('<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.3/themes/smoothness/jquery-ui.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simplePagination.js/1.6/simplePagination.min.css">');
    $("head").append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css">');
    $.fn.bootstrapBtn = $.fn.button.noConflict();
  }).fail(function () {
    console.error('Failed to load required scripts');
  });

  $('.Submit').hide();

  $(document).on('dblclick', '.note-text .cf-field', function () {
    const noteTextField = $(this).find('textarea');
    const currentText = $(noteTextField).val();

    $.dialog({
      title: 'Note',
      content: currentText,     // Injects text as HTML string; sanitize if content is untrusted.
      useBootstrap: false,      // Use jquery-confirm's native styling instead of Bootstrap.
      boxWidth: '800px',
    });
  });
});
