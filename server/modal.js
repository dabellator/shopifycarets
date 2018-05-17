
function facebook(d, s, id) {
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '1874623182612206',
      cookie     : true,
      xfbml      : true,
      version    : 'v2.12'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
};

function init() {
  var modal = document.createElement('div');
  var text = document.createTextNode('Save money now by sharing on FB');
  var button = document.createElement('div');

  button.className = 'fb-login-button';
  button.setAttribute('data-width', '250');
  button.setAttribute('data-max-rows', '1');
  button.setAttribute('data-size', 'large');
  button.setAttribute('data-button-type', 'continue_with');
  button.setAttribute('data-show-faces', 'false');
  button.setAttribute('data-button-type', 'continue_with');
  button.setAttribute('data-auto-logout-link', 'false');
  button.setAttribute('scope', 'public_profile,publish_actions');
  
  modal.appendChild(text);
  modal.appendChild(button);

  document.body.appendChild(modal)

  facebook(document, 'script', 'facebook-jssdk')
};

init();
