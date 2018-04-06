// ==UserScript==
// @name         BadReadrScript
// @namespace    http://tampermonkey.net/
// @version      1.0.8
// @description  Makes reading texts on reddit esier. Hopefully.
// @author       /u/GamingWolfie
// @match        *.reddit.com/r/*/comments/*
// @updateURL    https://raw.githubusercontent.com/GamingWolf/BadReadrScript/master/BadReadrScript.user.js
// @license      MIT; https://opensource.org/licenses/MIT
// @grant        none
// ==/UserScript==

(function() {
	'use strict';


    jQuery.fn.modal = function () {
        this.css("display","none");
        this.css("position", "fixed");
        this.css("z-index", "1");
        this.css("padding-top", "100px");
        this.css("padding-bottom", "100px");
        this.css("left", "0");
        this.css("top", "0");
        this.css("width", "100%");
        this.css("height", "100%");
        this.css("overflow", "auto"); //overflow-y
        this.css("background-color", "rgb(0,0,0)");
        this.css("background-color", "rgba(0,0,0,0.4)");
        return this;
    };//css modal

    jQuery.fn.modalContent = function () {
        this.css("background-color", "#fefefe");
        this.css("margin", "auto");
        this.css("padding", "15px");
        this.css("border", "1px solid #888");
        this.css("width", "80%");
        this.css("overflow-y", "initial");
	    return this;
    };//css modal-content

    $(document).ready(function(){
        var baseDomain = (window.location.hostname == 'mod.reddit.com' ? 'https://www.reddit.com' :  `https://${window.location.hostname}`);
        var author = $(".author")[12].innerHTML; //the 12 means it's the array=12 instance of the class "author". 0=you, 1=adam_wizzy, 2-11=mods, 12=author, 13=first commenter, etc.

        var Btn = $('<button id="myBtn" title="Display the author\'s submissions to HFY as part of a wikipage template">Wiki Template</button>');
//                    <p><span id="totalSubmissions">${totalSubmissions}</span> total submission, <span id="storyCount">${storyCount}</span> of which are in HFY</p>
        var BtnContent = $(`
            <div id="myModal" class="modal" style="font-size: 120%;" >
                <div class="modal-content">
                    <span class="close" style="float:right; font-size:28px; font-weight:bold;">&times;</span>
                    <h1 style="font-size: 200%" id="username"><a href="${baseDomain}/user/${author}" target="_blank">/u/${author}</a></h1>
                    <p><button id="afterBtn" title="wowza! that\'s a lot of stories to just be getting a wiki page now...">load</button> <-if the user has more than 100 stories you need to click this to get the rest to load...</p>
                    <hr/>
                    <h1><strong>Wiki:</strong> * [${author}](<a href="${baseDomain}/r/hfy/wiki/authors/${author}" target="_blank">/r/hfy/wiki/authors/${author.toLowerCase()}</a>)</h1>
                    <h1><strong>WIKI MARKDOWN:</strong></h1>
                    <div class="authorpage" style="border:1px solid gray; font-size: 90%; background:lightgray;">
                        <p>**${author}**</p>
                        <p>&nbsp;</p>
                        <p>##**One Shots**</p>
                        <span id="stories"></span>
                        <br/>
                        <p>&amp;nbsp;</p>
                        <p>---</p>
                        <p>[All Authors](${baseDomain}/r/hfy/wiki/authors)</p>
                    </div>
                    <hr/>

                    <p>Don't forget to give editing permission to the user, send a message, and list the page on <a href="${baseDomain}/r/hfy/wiki/authors)" target="_blank">All Authors</a></p>
                </div>
            </div>
        `);

        //add in the button and it's contents
        $(".expando").prepend(Btn);
//        $("#siteTable .entry > ul").append( `<li> ` + Btn + ` </li>` ); // the object isn't showing up, for some reason... dunno
        $("body").append(BtnContent);

        // format css elements
        $(".modal").modal();
        $(".modal-content").modalContent();

        // When the user clicks the button, open the modal
        $("#myBtn").click(function() {
	        $(".modal").css("display","block");
            $('body').css("overflow", "hidden");
	    });

        // When the user clicks on <span> (x), close the modal
        $('.close')[0].onclick = function() {
            $('.modal').css("display","none");
            $('body').css("overflow", "auto");
        };

        //getting the json with the information
        var lastID = null;
        var totalSubmissions;
        var storyCount;

        function load(after) {
            var params = {
                'after': after,
                'sort': 'new',
                'limit': 100
            };

            $.getJSON(`${baseDomain}/user/${author}/submitted.json`, params, function (data) {
                var children = data.data.children;
                $.each(children, function (i, post) {
                    if (post.data.subreddit == "HFY"){
                            $("#stories").prepend( `<p>* [<a href="${post.data.url}">` + post.data.title + `</a>](` + post.data.url + `)</p>\n` );
//                            storyCount ++;
                        }
                });
                if (children && children.length > 0) {
                    lastID = children[children.length - 1].data.id;
//                    totalSubmissions = children.length;
                } else {
                    lastID = null;
                }
            })
            .error(function() { $("#stories").append( `ERROR ... Shadowbanned?`); });
        }

        lastID = load(lastID);
//        $('#totalSubmissions').innerHTML = totalSubmissions;
//        $('#storyCount').innerHTML = storyCount;

        $('#afterBtn').click(function () {
            if (lastID) {
                load('t3_' + lastID);
            }
        });

    });//document ready

})();

