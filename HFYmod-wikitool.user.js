// ==UserScript==
// @name         HFYmod-wikitool
// @namespace    http://tampermonkey.net/
// @version      0.5.2
// @description  A tool for Reddit's r/HFY wiki Mods 
// @author       /u/sswanlake
// @match        *.reddit.com/r/HFY/comments/*
// @updateURL    https://github.com/sswanlake/HFYmod-wikitool/raw/master/HFYmod-wikitool.user.js
// @grant        none
// ==/UserScript==

// what's new: autoloads all stories, close button cursor pointer

(function() {
	'use strict';

    jQuery.fn.modal = function () {
        this.css("display","none");
        this.css("position", "fixed");
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
	this.css("color", "#000000");
        this.css("margin", "auto");
        this.css("padding", "15px");
        this.css("border", "1px solid #888");
        this.css("width", "80%");
        this.css("overflow-y", "initial");
        return this;
    };//css modal-content

    function timeConvert(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = (`0${a.getUTCMonth() + 1}`).slice(-2);
        var date = (`0${a.getUTCDate()}`).slice(-2);
        var hour = (`0${a.getUTCHours()}`).slice(-2);
        var min = (`0${a.getUTCMinutes()}`).slice(-2);
        var sec = (`0${a.getUTCSeconds()}`).slice(-2);
        return `${month}-${date}-${year} ${hour}:${min}:${sec}`;
    }//make dates human readable

    $(document).ready(function(){
        var baseDomain = (window.location.hostname == 'mod.reddit.com' ? 'https://www.reddit.com' :  `https://${window.location.hostname}`);
        var author = $(".author")[12].innerHTML; //the 12 means it's the array=12 instance of the class "author". 0=you, 1=adam_wizzy, 2-11=mods, 12=author, 13=first commenter, etc.

        var Btn = $('<button id="myBtn" title="Display the author\'s submissions to HFY as part of a wikipage template">Wiki Template</button>');
        var BtnContent = $(`
            <div id="myModal" class="modal" style="font-size: 120%;" >
                <div class="modal-content">
                    <span class="close" style="float:right; font-size:28px; font-weight:bold; cursor: pointer;">&times;</span>
                    <h1 style="font-size: 200%" id="username"><a href="${baseDomain}/user/${author}" target="_blank">/u/${author}</a></h1>
                    <p><span id="totalSubmissions" style="color:red"></span> total submissions, <span id="hfycount" style="color:red"></span> of which are in HFY</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Of those, <span id="storycount" style="color:red"></span> are stories and <span id="metacount" style="color:red"></span> are other submissions</p>
                    <hr/>
                    <h1><strong>WIKI:</strong> <a href="${baseDomain}/r/hfy/wiki/authors/${author}" target="_blank">${author}</a></h1>
                    <div class="authorpage" style="border:1px solid gray; background:lightgray; height:200px; overflow-y:auto; overflow-x:auto;">
                        <p>**${author}**</p>
                        <p>&nbsp;</p>
                        <p>##**One Shots**</p>
                        <pre><span id="stories"></span></pre>
                        <br/>
                        <p>##**Series**</p>
                        <p>####[SERIES](/r/hfy/wiki/series/SERIES)</p>
                        <br/>
                        <p>&amp;nbsp;</p>
                        <p>---</p>
                        <p>[All Authors](${baseDomain}/r/hfy/wiki/authors)</p>
                    </div>
                    <p>Don't forget to give editing permission to the user, send a message, and list the page on <a href="${baseDomain}/r/hfy/wiki/authors)" target="_blank">All Authors</a></p>
                    <hr/>
                    <p>Other submissions:</p>
                    <div class="otherposts" style="border:1px solid gray; background:lightgray; overflow-x:auto;">
                        <p><pre><span id="otherposts"></span></pre></p>
                    </div>
                    <p>&nbsp;</p>
                    <div style="border:1px solid gray; background:lightgray; overflow-x:auto;">
                        <pre>You have been added to the wiki. We created the following pages for you.
&nbsp;
* [<span id="series">SERIES</span>](/r/hfy/wiki/series/SERIES)\n
* [${author}](<a href="${baseDomain}/r/hfy/wiki/authors/${author}" target="_blank">/r/hfy/wiki/authors/${author.toLowerCase()}</a>)\n
You are free to edit your pages as you see fit. We strongly recommend maintaining your own pages. [Here](http://www.reddit.com/r/hfy/wiki/ref/wiki_updating) is a little guide to Wiki updating if you need it. If you start a new series please let us know so that we can create the page. If you have any questions send us a [message](http://www.reddit.com/message/compose?to=%2Fr%2FHFY).\n
                        </pre>
                    </div>
                </div>
            </div>
        `);

        //add in the button and it's contents
        $(".expando").prepend(Btn);
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
            $('body').css("overflow","auto");
        };

        //getting the json with the information
        var lastID = null;
        var totalSubmissions = 0;
        var hfycount = 0;
        var storycount = 0;
        var metacount = 0;

	function load(after) {
            $.getJSON(`${baseDomain}/user/${author}/submitted.json?sort=new&after=${after}`, function (data) {
                var children = data.data.children;
                var date;
                $.each(children, function (i, post) {
                    if (post.data.subreddit == "HFY"){
                        date = timeConvert(post.data.created_utc);
                        hfycount++;
                        if (post.data.link_flair_css_class == ("META" || "Text" || "Misc" || "Video")){
                            $("#otherposts").prepend( `* <a href="${post.data.url}" title=" created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n` );
                            metacount++;
                        } else {
                            if (post.data.over_18) {
                                $("#stories").prepend( `* [<a href="${post.data.url}" title="created: ${date},  score: ${post.data.score}">` + (post.data.title).replace(`[OC]`, '').trim() + `</a>](` + post.data.url + `) <emphasis style="color:red;">*NSFW*</emphasis>\n` );
                            } else {
                                $("#stories").prepend( `* [<a href="${post.data.url}" title="created: ${date},  score: ${post.data.score}">` + (post.data.title).replace(`[OC]`, '').trim() + `</a>](` + post.data.url + `)\n` );
                            }
                            storycount++;
                        }
                    }
                    $('#hfycount').html(`${hfycount}`);
                    $('#storycount').html(`${storycount}`);
                    $('#metacount').html(`${metacount}`);
                });
                if (children && children.length > 0) {
                    lastID = children[children.length - 1].data.name;
                    totalSubmissions += children.length;
                    $('#totalSubmissions').html(`${totalSubmissions}`);
                    load(lastID);
                }
            })
            .error(function() { $("#stories").append( `ERROR ... Shadowbanned?`); });
        } //end load

        load(lastID);

    });//document ready

})();

