var editor = new MediumEditor('.editable', {
  buttons: ['bold', 'italic', 'anchor', 'header1', 'header2', 'quote', 'unorderedlist', 'pre'],
  paste: {
    // This example includes the default options for paste, if nothing is passed this is what it used
    forcePlainText: false,
    cleanPastedHTML: true,
    cleanReplacements: [],
    cleanAttrs: ['class', 'style', 'dir'],
    cleanTags: ['meta']
  }
});

$(function () {
  $('.editable').mediumInsert({
    editor: editor,
    beginning: true,
    addons: {
      images: {
        deleteScript: '/editor/delete-file',
        fileUploadOptions: {
          url: '/editor/upload'
        }
      },
      embeds: {
        oembedProxy: '/editor/oembed'
      }
    }
  });
  $('.editable').focus(function(){
    $('.placeholder').removeClass('placeholder');
  });

  $.post('/editor/test-login', {}, function(response) {
    $('#publish_btn span').text(response.logged_in ? 'Publish' : 'Sign In');
  });

  $('#publish_btn').click(function(){
    if($('.publish-dropdown').hasClass('hidden')) {
      $('.publish-dropdown').removeClass('hidden');
    } else {
      $('.publish-dropdown').addClass('hidden');
    }
  });

  $('#--publish_btn').click(function(){
    if($('#publish_btn span').text() == 'Publish') {

      $.post('/editor/publish', {
        name: $("#post-name").val(),
        body: editor.serialize().content.value
      }, function(response) {
        if(response.location) {
          reset_page().then(function(){
            window.location = response.location;
          });
        }
      });

    } else {
      var url = prompt("Enter your URL");
      window.location = '/auth/start?me=' + encodeURIComponent(url) + '&redirect=/editor';
    }
  });

  $('#new_btn').click(function(){
    reset_page();
  });

});

function reset_page() {
  $("#post-name").val('');
  $("#content").html('<p class="placeholder">Write something nice...</p>');
  $("#draft-status").text("New");
  return localforage.setItem('currentdraft', {});
}

function onUpdateReady() {
  // Show the notice that says there is a new version of the app
  $("#new_version_available").show();    
}

window.applicationCache.addEventListener('updateready', onUpdateReady);
if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
  onUpdateReady();
}  

/* ************************************************ */
/* autosave loop */
var autosaveTimeout = false;
function contentChanged() {
  clearTimeout(autosaveTimeout);
  $("#draft-status").text("Draft");
  autosaveTimeout = setTimeout(doAutoSave, 1000);
}
function doAutoSave() {
  autosaveTimeout = false;
  var savedData = {
    title: $("#post-name").val(),
    body: editor.serialize().content.value
  }
  localforage.setItem('currentdraft', savedData).then(function(){
    $("#draft-status").text("Saved");
  });
}
$(function(){
  // Restore draft if present
  localforage.getItem('currentdraft', function(err,val){
    if(val && val.body) {
      $("#post-name").val(val.title);
      $("#content").html(val.body);
      $("#draft-status").text("Restored");
    }
  });
});
/* ************************************************ */


// Not sure why this isn't working
// editor.subscribe('editableInput', function(ev, editable) {
//   console.log("stuff changed");  
// });  

// This one works okay tho, but misses changes from the image uploader
editor.on(document.getElementById('content'), 'input', function(){
  contentChanged();
});
$(function(){
  $('#post-name').on('keyup', contentChanged);
});
