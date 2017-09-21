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

 function googleError(data){
   console.log(data);
   alert('An error occured when loading google maps.');
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

    // Go through all restaurants and format name and lat long for URL
    restaurants.forEach(function(restaurant){
      formatName(restaurant);
      formatLatLong(restaurant);
    });

    // Go through all restaurants and create a marker for each one
    restaurants.forEach(function(restaurant){
      createMarker(restaurant);
    });

    // Format restaurant name so that it can be passed as a param in URL
    function formatName(restaurant){
      var formattedName = restaurant.name.split(' ').join('%20');
      restaurant.formattedName = formattedName;
    }

    // Format a restaurant's location so that it can be passed as a param in URL
    function formatLatLong(restaurant){
      var formattedLatLong = " " + restaurant.location.lat + ',' + restaurant.location.lng;
      restaurant.formattedLatLong = formattedLatLong;
    }

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

        // open current restaurant marker
        openRestaurantMarker(restaurant);
      });
    }

    // Open the corresponding infowindow for a restaurant and populate it with
    // info from the restaurant's Foursquare page.
    openRestaurantMarker = function(restaurant){
      resetMarkerIcon(restaurant);
      restaurant.marker.setIcon("images/clicked-marker.png");
      map.panTo(restaurant.marker.position);
      getFourSquareData(restaurant, restaurant.marker);
      infowindow.open(map, restaurant.marker);
    };

    // reset icon for previous marker
    function resetMarkerIcon(restaurant){
      if(infowindow.marker != restaurant.marker){
        if(typeof infowindow.marker !== "undefined"){
          var previousMarker = infowindow.marker;
          previousMarker.setIcon("images/default-marker.png");
        }
      }
    }

    // Make request to Foursquare API using venues search
    function getFourSquareData(restaurant, marker){
      var baseURL = "https://api.foursquare.com/v2/venues/search?v=20161016&ll=";
      var latLong = restaurant.formattedLatLong;
      var formattedName = restaurant.formattedName;
      var clientID = "G4DRVXPMGEUYV2HUQP4ZXXSEOHFEJKIQRTIUW1NZYF5Z1FJ3";
      var clientSECRET = "A4QNLC2UPUQ4Z3R3PFRW055S04OU3QRBXUQYFL4N5P0LMY43";
      var query = formattedName;
      var params = latLong + "&query=" + formattedName + "&intent=checkin&client_id=" + clientID + "&client_secret=" + clientSECRET;
      var foursquareURL = baseURL + params;
      $.ajax({
        type: "POST",
        url: foursquareURL,
        success: function(data){
          useAPIData(data, restaurant, marker);
        },
        error: function(e){
          console.log(e);
          alert('There was a problem fetching restaurant data from Foursquare.');
        }
      });
    }

    // Use API data and add it to a restaurant, then populate the infowindow
    function useAPIData(data, restaurant, marker){
      var foursquareRestaurant = data.response.venues[0];
      var name = foursquareRestaurant.name;
      var phone = foursquareRestaurant.contact.formattedPhone;
      var website = foursquareRestaurant.url;
      restaurant.address = foursquareRestaurant.location.address;
      if(phone === undefined){
        restaurant.phone = "Not available.";
      } else {
        restaurant.phone = phone;
      }
      if(website === undefined){
        restaurant.url = "Not available.";
      } else {
        restaurant.url = website;
      }
      populateInfoWindow(marker, restaurant);
    }

    // Populate the infowindow
    function populateInfoWindow(marker, restaurant){
      if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div id="infowindow">' +
        '<h5 class="marker-name">' + restaurant.name + '</h5>'+
        '<p>' + '<span class=bold>Address: </span>' + restaurant.address + '</p>' +
        '<p>' + '<span class=bold>Phone: </span>' + restaurant.phone + '</p>' +
        '<p>' + '<span class=bold>Website: </span>' + '<a href="' + restaurant.url + '">' + restaurant.url + '</a>' + '</p>' +
        '<p class="small">' + "info provided by Foursquare" + '</p>'+
        '</div>');
        var currentMarker = infowindow.marker;
        return currentMarker;
      }
    }

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
  }; // viewModel ends
