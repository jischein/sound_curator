$(document).ready(function() {


    $("#content").hide();
    $("#loader").hide();
    $("#loader-2").hide();
    $(".wrapper").hide();
    // Initialization of SDK
    SC.initialize({
        client_id: "WBaeNUNbh8JozNYYP87NjyVfZYnd2D4X",
        redirect_uri: "http://soundcurator.co/callback.html"
    });

    // Login handler
    var user_perma;
    $("#button-enter").click(function() {
        SC.connect().then(function() {
            return SC.get('/me');
        }).then(function(me) {
            $("#button-enter").hide();
            $("#loader").show();
            // $("#loader-tag").show();
            getFollowing();

        });

    });

    function getRandomSubarray(arr, size) {
        var shuffled = arr.slice(0),
            i = arr.length,
            temp, index;
        while (i--) {
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }
        return shuffled.slice(0, size);
    }


    function getFollowing() {

        SC.get('/me/followings', {
            limit: 200
        }).then(function(followings) {
            var page_size = 200;
            var following_users = [];
            var collection = followings.collection;
            if (collection.length >= 6){
              var follower1 = collection[Math.floor(Math.random() * collection.length)];
              var follower2 = collection[Math.floor(Math.random() * collection.length)];
              var follower3 = collection[Math.floor(Math.random() * collection.length)];
              var follower4 = collection[Math.floor(Math.random() * collection.length)];
              var follower5 = collection[Math.floor(Math.random() * collection.length)];
              var follower6 = collection[Math.floor(Math.random() * collection.length)];

              following_users.push(follower1, follower2, follower3, follower4, follower5, follower6);

              //strip arr of duplicates just incase
              following_users = following_users.filter(function(item, pos) {
                  return following_users.indexOf(item) == pos;
              });
              getTracksOnward(following_users, follower1, [], 0);
            }
            else{
              $("#error-message").show();
            }
        },function(error){

            //restart process for now if given 500 soundcloud side error
            getFollowing();
        });


    }

    //init getTracks function, grabs first user and then executes grabData
    function getTracksOnward(users, user, tracks, page) {

        var trackLimit = 100;
        SC.get('/users/' + user.permalink + '/favorites', {
            limit: trackLimit
        }).then(function(favorites) {

        },function(error){
            //restart process for now if given 500 soundcloud side error
            getFollowing();
        });

        SC.get('/users/' + user.permalink + '/favorites', {
            limit: trackLimit,
            linked_partitioning: 1
        }).then(function(favorites) {
            tracks = tracks.concat(favorites.collection);
            grabData(favorites.next_href, tracks, user, users, page + 1);

        },
        function(error){
          //restart process for now if given 500 soundcloud side error
          getFollowing();
        });
    }

    function grabData(url, cur_trax, cur_user, users, page) {

        if (!url || page > 3) {
            //look at index of user we are currently scraping
            var cur_index = users.indexOf(cur_user);
            //if at end of following users list stop, if not keep scraping with current tracks passed as param as well
            if (cur_index != users.length - 1) {
                getTracksOnward(users, users[cur_index + 1], cur_trax, 0);
            } else {
                var playlist = getRandomSubarray(cur_trax, 20);

                var set = {};
                set = playlist.map(function(track) { return {id: track.id} });
                window.set = set;
                $("#loader").hide();
                $("#loader-tag").hide();
                $("#loader-2").hide();
                renderTracks(playlist, 0)

            }

        } else {
            $.getJSON(url, function(data) {
                cur_trax = cur_trax.concat(data.collection);

                if (data.next_href && data.length != 0) {
                    grabData(data.next_href, cur_trax, cur_user, users, page + 1);
                } else {
                    //look at index of user we are currently scraping
                    var cur_index = users.indexOf(cur_user);
                    //if at end of following users list stop, if not keep scraping with current tracks passed as param as well
                    if (cur_index != users.length - 1) {
                        getTracksOnward(users, users[cur_index + 1], cur_trax, 0);
                    } else {
                        var playlist = getRandomSubarray(cur_trax, 20);

                        var set = {};
                        set = playlist.map(function(track) { return {id: track.id} });
                        window.set = set;

                        $('body').data('playlist', set);
                        $("#loader").hide();
                        $("#loader-tag").hide();
                        $("#loader-2").hide();
                        renderTracks(playlist, 0);


                    }

                }
            });
        }

    }


    // function for rendering playlists
    // s/o this project for helping me write this render method https://github.com/aaron235/SoundVane
    function renderTracks(tracks, ind) {
        var container = document.querySelector(".content ul");

        var trackLi = document.createElement("li");

        trackLi.innerHTML = "<iframe width='100%' height='150' scrolling='no' frameborder='no' src='https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/" +
            tracks[ind].id + "&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=true&amp;show_reposts=false&amp;visual=true'></iframe>";

        container.appendChild(trackLi);

        var trackWidget = SC.Widget(trackLi.firstChild);
        if (ind == tracks.length - 1){
          $(".options").show();
          $("#save").show();
        }

        if (ind + 1 < tracks.length) {
            trackLi.firstChild.addEventListener("load", function() {
                //render next track
                var nextTrackWidget = renderTracks(tracks, ind + 1);

                trackWidget.bind(SC.Widget.Events.FINISH, function() {
                    nextTrackWidget.play();
                });

            });

        }

        return trackWidget;
    }

    $("#more").click(function(){
      $(".options").hide();
      $("#loader-2").show();
      $(".wrapper").hide();
      getFollowing();
    });

    //saving a playlist UI
    $("#save").click(function(){
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();
      var newDate = month + "/" + day + "/" + year;
        SC.post('/playlists', {
          playlist: { title: 'SoundCurator Playlist' + " - " + newDate, tracks: window.set }, function(response){
          }
        });

        //access playlist url
        SC.get('/me/playlists', { limit: 1 }).then(function(playlist){
            var curated_url = playlist[0].permalink_url;
            $("#save").hide();
            $("#saved-modal").fadeTo(0.5, 1, function(){
              $("#saved-modal").show();
              $("#curated-link").attr("href", curated_url);
              $("#curated-link").html(curated_url);
            });
        });
        // $(".wrapper").show();

    });

    $("#close-btn2").click(function(){
      $("#saved-modal").fadeTo(0.5, 0);
      setTimeout(function(){
        $("#saved-modal").hide();
      }, 250)
      $("#save").show();
    });

    $("#about-tag").click(function(){
      $("#about-overlay").fadeTo(0.5, 1, function(){
        $("#about-overlay").show();
        $("#about-tag").hide();
      });
    });

    $("#close-btn").click(function(){
      $("#about-overlay").fadeTo(0.5, 0);
      setTimeout(function(){
        $("#about-overlay").hide();
      }, 250)
      $("#about-tag").show();

    });

});
