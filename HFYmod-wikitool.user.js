// ==UserScript==
// @name         HFYmod-wikitool
// @namespace    http://tampermonkey.net/
// @version      0.5.4.1
// @description  A tool for Reddit's r/HFY wiki Mods 
// @author       /u/sswanlake
// @match        *.reddit.com/r/HFY/comments/*
// @updateURL    https://github.com/sswanlake/HFYmod-wikitool/raw/master/HFYmod-wikitool.user.js
// @grant        none
// ==/UserScript==

//previously: can highlight lines now! also adds empty series template
//what's new: turns series pretty colors

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
        this.css("padding-bottom", "100px");
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
                    <div class="authorpage" id="authorpage" style="border:1px solid gray; background:lightgray; height:250px; overflow-y:auto; overflow-x:auto;">
                        <p>**${author}**</p>
                        <p>&nbsp;</p>
                        <p>##**One Shots**</p>
                        <pre><span id="stories"></span></pre>
                        <br/>
                        <p>##**Series**</p>
                        <pre><span id="author-series"></span></pre>
                        <p>&nbsp;</p>
                        <p>&amp;nbsp;</p>
                        <p>---</p>
                        <p>[All Authors](${baseDomain}/r/hfy/wiki/authors)</p>
                    </div>
                    <p>Don't forget to give editing permission to the user, send a message, and list the page on <a href="${baseDomain}/r/hfy/wiki/authors)" target="_blank">All Authors</a></p>
                    <hr/>
                    series name: <input type="text" id="seriesname" value="" /> (Hit enter to submit) <button id="unhighlight">Unhighlight</button>
                    <p>Other submissions:</p>
                    <div class="otherposts" style="border:1px solid gray; background:lightgray; height:250px; overflow-y:auto; overflow-x:auto;">
                        <pre><span id="otherposts"></span></pre>
                    </div>
                    <p>&nbsp;</p>
                    <div style="border:1px solid gray; background:lightgray; overflow-x:auto;">
                    <pre>You have been added to the wiki. We created the following pages for you.
&nbsp;
<span id="message-serieslink"></span>* [${author}](<a href="${baseDomain}/r/hfy/wiki/authors/${author}" target="_blank">/r/hfy/wiki/authors/${author.toLowerCase()}</a>)\n
You are free to edit your pages as you see fit. We strongly recommend maintaining your own pages. [Here](http://www.reddit.com/r/hfy/wiki/ref/wiki_updating) is a little guide to Wiki updating if you need it. If you start a new series please let us know so that we can create the page. If you have any questions send us a [message](http://www.reddit.com/message/compose?to=%2Fr%2FHFY).\n
</pre>
                    </div>
                    <div class="endOfModal">
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
            $.getJSON(`https://www.reddit.com/user/${author}/submitted.json?sort=new&after=${after}`, function (data) { //&count=100 is no longer working?
                var children = data.data.children;
                var date;
                $.each(children, function (i, post) {
                    if (post.data.subreddit == "HFY"){
                        date = timeConvert(post.data.created_utc);
                        hfycount++;
                        if ((post.data.link_flair_css_class == "META") || (post.data.link_flair_css_class == "Text") || (post.data.link_flair_css_class == "Misc") || (post.data.link_flair_css_class == "Video") || (post.data.link_flair_text == "WP")){
                            $("#otherposts").prepend( `<label id="metacount">* <a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n</label>` );
                            metacount++;
                        } else {
                            if (post.data.over_18) {
                                $("#stories").prepend( `<label id="storycount">* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + (post.data.title).replace(`[OC]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>](` + post.data.url + `) <emphasis style="color:red;">*NSFW*</emphasis>\n</label>` );
                            } else {
                                $("#stories").prepend( `<label id="storycount">* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + (post.data.title).replace(`[OC]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>](` + post.data.url + `)\n</label>` );
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
            .error(function() {
                if (author == "[deleted]") {
                    $("#stories").append( `<span style="color:red">ERROR - ACCOUNT DELETED</span>`);
                } else {
                    $("#stories").append( `<span style="color:red">ERROR ... Shadowbanned?</span>`);
                }
            }); //end error
        } //end load

        load(lastID);
        if ($("#otherposts")[0].innerHTML === "") { //hide otherposts if none present
            $(".otherposts").css("height", "auto");
        }

	String.prototype.toProperCase = function () { //small function to capitalize the first letter of every word
            return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        };

        // When user enters the series
        var series;
        var series_;
        var seriescount = 0;
        var colors = ["Bisque", "Khaki", "LightGreen", "LightCyan", "LightSteelBlue", "Plum", "GoldenRod", "LightPink", "LightCoral", "LightSalmon"];
        var seriesContent = (`
            <hr/>
            <p>Series no. <span id="series-count">${seriescount}</span></p>
            <div class="seriespage" style="border:1px solid gray; background:lightgray;">
                <p>[**${author}**](/r/hfy/wiki/authors/${author})</p>
                <p>&nbsp;</p>
                <p>##**<span id="series-header">Series</span>**</p>
                <pre><span id="seriesStories"></span></pre>
                <p>&nbsp;</p>
                <p>&amp;nbsp;</p>
                <p>---</p>
                <p>[All Series](https://www.reddit.com/r/HFY/wiki/series)</p>
            </div>
        `);

        $("#seriesname").keyup(function(e){
            var code = e.which; // recommended to use e.which, it's normalized across browsers
            if(code==13)e.preventDefault();
            if(code==13){ //32=spacebar 13=enter 188=comma 186=semicolon
                series = $(this).val();
                series_ = series.toLowerCase().replace(/\s/g, '_').replace(/['!"#$\-%&\\'()\*+,\.\/:;<=>?@\[\\\]\^`{|}~']/g,""); //the url, to be not case-sensitive
                $(this).val(''); //reset input field
                seriescount++;
                $(".endOfModal").prepend(seriesContent); //for some reason the numbering gets reverse if you append
                $('#series-count').attr("id", "series-count-" + seriescount).html(`${seriescount}`); //gives each series template a unique id
                $("#author-series").append( `####[<a href="https://www.reddit.com/r/hfy/wiki/series/${series.replace(/\s/g, '_').replace(/['!"#$%&\\'()\*+,\.\/:;<=>?@\[\\\]\^`{|}~']/g,"").toLowerCase()}" target="_blank">${series.toProperCase()}</a>](/r/hfy/wiki/series/${series.replace(/\s/g, '_').replace(/[.,\/#!?$%\^&\*;:{}=\`~()]/g,"").toLowerCase()})\n <span id="${seriescount}"></span>\n` );
                $("#message-serieslink").append( `* [${series.toProperCase()}](<a href="https://www.reddit.com/r/hfy/wiki/series/${series.replace(/\s/g, '_').replace(/['!"#$%&\\'()\*+,\.\/:;<=>?@\[\\\]\^`{|}~']/g,"").toLowerCase()}" target="_blank">/r/hfy/wiki/series/${series.replace(/\s/g, '_').replace(/[.,\/#!?$%\^&\*;:{}=\`~()]/g,"").toLowerCase()}</a>)\n <span id="${seriescount}"></span>\n` );
                $("#series-header").html(`${series.toProperCase()}`).css("background-color", colors[(seriescount)%colors.length]);
                $("label:contains('" + series + "'), label:contains('" + series_ + "')").css("background-color", colors[(seriescount)%colors.length]); //contains series or series_ = no longer case sensitive!
            }
        }); //end get series

        // When the user clicks the button, unhighlight the awkward series maker
        $("#unhighlight").click(function() {
	        $("label").css("background-color","transparent");
	    });
	});

    });//document ready

})();
