// Call Facebook Graph API
  window.fbAsyncInit = function() {
    FB.init({
      appId            : '114425175911312',
      autoLogAppEvents : true,
      xfbml            : true,
      version          : 'v2.10'
    });
    FB.AppEvents.logPageView();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

// Model
var map;
var markers = [];

  // Initalize map function and apply bindings
 function initMap(){
   var paris = {lat:48.8554235, lng: 2.3427983};
   map = new google.maps.Map(document.getElementById('map'),{
     zoom: 13,
     center: paris,
     styles: [
       {
         featureType: 'water',
         elementType: 'geometry.fill',
         stylers: [{color: '#92B5D9'}]
       },
       {
         featureType: 'poi.business',
         stylers: [{visibility: 'off'}]
       },
       {
         featureType: 'road.highway',
         elementType: 'labels',
         stylers: [{visibility: 'off'}]
       }
     ]
   });
   // Apply knockout bindings
   ko.applyBindings(new viewModel());
 }

  // ViewModel
  var viewModel = function(){
    var self = this;
    self.restaurantList = ko.observableArray(restaurants);

    // Create an infowindow
    var infowindow = new google.maps.InfoWindow({
      maxWidth: 200
    });

    // Store user input
    self.query = ko.observable('');

    // Go through all restaurants and create a marker for each one
    restaurants.forEach(function(restaurant){
      createMarker(restaurant);
    });

    // Filter input results
    self.search = ko.computed(function(){
      var query = this.query().toLowerCase();
      if(!query) {
        // go through markers array and set markers to visible
        markers.forEach(function(marker){
          marker.setVisible(true);
        });
        // display list of all restaurants
        return self.restaurantList();
      } else {
        // display filtered results
        var restaurantList = self.restaurantList();
        return restaurantList.filter(function(restaurant) {
          var restaurantName = restaurant.name;
          var filterResult =  (restaurantName.toLowerCase().indexOf(query) > -1);
          restaurant.marker.setVisible(filterResult);
          return filterResult;
        });
        // hide markers that didn't appear on results using setVisible(false)
      }
    }, self);


    // Create a marker for a restaurant and add it to the markers array
    function createMarker(restaurant){
      var position = restaurant.location;

      restaurant.marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: "images/default-marker.png",
        name: restaurant.name,
        about: restaurant.about,
        id: restaurant.id,
        animation: google.maps.Animation.DROP
      });

      // Push the marker to array of markers
      markers.push(restaurant.marker);

      // Get Facebook info on restaurant when marker is clicked
      restaurant.marker.addListener('click', function(){
        restaurant.marker.setIcon("images/clicked-marker.png");
        getFacebookInfo(restaurant, this);
        infowindow.open(map, this);

      });
    }

    // Get Facebook info on restaurant and populate the infowindow with it
    function getFacebookInfo(restaurant, marker){
      FB.api(restaurant.id, {fields: 'about', access_token: '114425175911312|wQm57weM4RPUUT5Labp_kAjKGhM'}, (response) => {
        if ( !response || response.error) {
          alert('An error occured when trying to get info from Facebook.');
        } else {
          restaurant.about = response.about;
          populateInfoWindow(marker, restaurant);
        }
      });
    }

    // Populate the infowindow
    function populateInfoWindow(marker, restaurant){
      if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div id="infowindow">' +
        '<p class="marker-name">' + restaurant.name + '</p>'+
        '<p class="marker-description">' + restaurant.about + '</p>' +
        '<p class="small">' + "info provided by restaurant's Facebook" + '</p>'+
        '</div>');
      }
    }

    // Open corresponding infowindow when restaurant name is clicked on the list
    openRestaurantMarkerFromList = function(restaurant){
      restaurant.marker.setIcon("images/clicked-marker.png");
      getFacebookInfo(restaurant, restaurant.marker);
      infowindow.open(map, restaurant.marker);
    };
  }; // viewModel ends

  // call initMap function
  initMap();
