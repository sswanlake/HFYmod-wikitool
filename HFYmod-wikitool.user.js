// ==UserScript==
// @name         HFYmod-wikitool
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  A tool for Reddit's r/HFY wiki Mods
// @author       /u/sswanlake
// @match        *.reddit.com/r/HFY/comments/*
// @updateURL    https://github.com/sswanlake/HFYmod-wikitool/raw/master/HFYmod-wikitool.user.js
// @grant        none
// ==/UserScript==

//previously: escapes underscores in usernames, displays "exists"/number on button, length of posts, doesn't show mod-removed, select text on click!
//what's new: changed meta from * to count, subtract removed, check if series page exists under author's name, list linked series pages, existing series count
//to do: suggest series names in a practical manner :)

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
        this.css("font-size", "120%");
        this.css("z-index", "999");
        return this;
    }; //css modal

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
    }; //css modal-content

    function timeConvert(UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = (`0${a.getUTCMonth() + 1}`).slice(-2);
        var date = (`0${a.getUTCDate()}`).slice(-2);
        var hour = (`0${a.getUTCHours()}`).slice(-2);
        var min = (`0${a.getUTCMinutes()}`).slice(-2);
        var sec = (`0${a.getUTCSeconds()}`).slice(-2);
        return `${month}-${date}-${year} ${hour}:${min}:${sec}`;
    } //make dates human readable

    String.prototype.toProperCase = function () {
        return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }; //capitalize first letter of given string

    function selectText(element) {
        var doc = document
            , text = element
            , range, selection
        ;
        if (doc.body.createTextRange) { //ms
            range = doc.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        } else if (window.getSelection) { //all others
            selection = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    } //function for selecting text in <pre> on click

    function ngram(sentence) {
        var common = ["part", "parts", "chapter", "chapters", "a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"];
        var nGram = "";
        var words_splitted = sentence.split(/[\W]+/);
        var registry = {};
        var words = [];
        for (var i = 0; i < words_splitted.length; i++) {
            if (words_splitted[i].match(/\w/)) {
                if ( !(common.includes(words_splitted[i])) ) {
                    words.push(words_splitted[i].toLowerCase());
                };
            }
        }
        for (var j = 0; j < words.length; j++) {
//            if (!(words[j] in registry) && !(common.includes(words[j])) ) {
            if (!(words[j] in registry) ) {
                registry[words[j]] = 1;
            } else {
                registry[words[j]]++;
            }
            var offset = j;
            var length = 1;
            while ((offset + length) < words.length) {
                var phrase = '';
                for (var x = offset; x <= (offset + length); x++) {
                    phrase += words[x] + ' ';
                }
                phrase = phrase.replace(/\s$/, '');
                if (!(phrase in registry)) {
                    registry[phrase] = 0;
                }
                registry[phrase]++;
                length++;
            }
        }
//        registry = registry.sort(function(a,b){ return a>b; });
//        var regis = registry.sort(function(a,b){ return a-b; });

        for (var phrases in registry) {
            if (registry[phrases] > 1) {
                if (!(phrases.match(/[0-9]/g, '') )) {
                    nGram += phrases + " (" + registry[phrases] + "), "
                }
            }
        }

        return nGram;
    } //end function ngram (for suggesting series names) //LEGACY - slow

    var seriesCounter = 0;
    var getFromBetween = {
        results:[],
        string:"",
        getFromBetween:function (sub1,sub2) {
            if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
            var SP = this.string.indexOf(sub1)+sub1.length;
            var string1 = this.string.substr(0,SP);
            var string2 = this.string.substr(SP);
            var TP = string1.length + string2.indexOf(sub2);
            return this.string.substring(SP,TP);
        },
        removeFromBetween:function (sub1,sub2) {
            if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
            var removal = sub1+this.getFromBetween(sub1,sub2)+sub2;
            this.string = this.string.replace(removal,"");
        },
        getAllResults:function (sub1,sub2) {
            // first check to see if we do have both substrings
            if(this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

            // find one result
            var result = this.getFromBetween(sub1,sub2);
            // push it to the results array
            this.results.push("[" + result + "], &nbsp; ");
            seriesCounter++;
            // remove the most recently found one from the string
            this.removeFromBetween(sub1,sub2);

            // if there's more substrings
            if(this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
                this.getAllResults(sub1,sub2);
            }
            else return;
        },
        get:function (string,sub1,sub2) {
            this.results = [];
            this.string = string;
            this.getAllResults(sub1,sub2);
            return this.results;
        }
    }; //get all substrings between two characters/strings //var result = getFromBetween.get(Contents,"(",")");

//---------------------------------------------------------------------------------------------

    $(document).ready(function(){
        var modhash = $('form.logout input[name=uh]').val(); //for calling the API, only used in wiki editing
        var domain = window.location.hostname; //for calling the API, only used in wiki editing
        var author = $(".author")[12].innerHTML; //the array=12 instance of the class "author". 0=you, 1=adamwizzy, 2-11=mods, 12=author, 13=first commenter, etc.

        var Btn = $('<button id="myBtn" title="Display the author\'s submissions to HFY as part of a wikipage template">Wiki Template <span id="YN"></span></button>');
        var preface = (`You have been added to the wiki. We created the following pages for you.\n\n`);
        var postface = (`* [${author.split("_").join("\\_")}](/r/HFY/wiki/authors/${author.toLowerCase()})\n\nYou are free to edit your pages as you see fit. We strongly recommend maintaining your own pages. [Here](http://www.reddit.com/r/HFY/wiki/ref/wiki_updating) is a little guide to Wiki updating if you need it. If you start a new series please let us know so that we can create the page. If you have any questions send us a [message](http://www.reddit.com/message/compose?to=%2Fr%2FHFY).\n`);
        var MessageURL = encodeURI(preface + postface); //...encode URI is supposed to make it nicely URL friendly, but doesn't seem to want to play right now... browsers are smart though
        var BtnContent = $(`
            <div class="modal">
                <div class="modal-content">
                    <span class="close" style="float:right; font-size:28px; font-weight:bold; cursor: pointer;">&times;</span>
                    <p style="font-size: 200%" id="username"><a href="https://www.reddit.com/user/${author}" target="_blank">/u/${author}</a></p>
                    <p><span id="totalSubmissions" style="color:red"></span> total submissions, <span id="hfycount" style="color:red"></span> of which are in HFY</p>
                    <p style="float:right"><span id="NSFWcount" style="color:red"></span> are NSFW — <span id="modremovedcount" style="color:red"></span> stories mod removed</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Of those, <span id="storycount" style="color:red"></span> are stories and <span id="metacount" style="color:red"></span> are other submissions</p>
                    <hr/>
                    <p><strong style="font-size: 150%">WIKI:</strong> <a href="https://www.reddit.com/r/HFY/wiki/authors/${author}" target="_blank" style="font-size: 150%">${author}</a>  &nbsp; &nbsp; <span id="existsYN"></span>  &nbsp; &nbsp; <a onclick="$('.authorpage').toggle()">hide author</a></p>
                    <div class="authorpage" id="authorpage" style="border:1px solid gray; background:Lavender; height:250px; overflow-y:auto; overflow-x:auto;"><pre><p>**${author.split("_").join("\\_")}**<br>
##**One Shots**
<span id="stories"></span>
<span id="serieslabel"></span>
&amp;nbsp;

---
[All Authors](https://www.reddit.com/r/HFY/wiki/authors)
</pre>
                    </div>
                    <p>Don't forget to <span style="color:red">give editing permissions</span> to the user, send a <a id="message" href="https://www.reddit.com/message/compose/?to=${author}&subject=HFY+Wiki&message=${MessageURL}" target="_blank">message</a>, and list the page on <a href="https://www.reddit.com/r/HFY/wiki/authors" target="_blank">All Authors</a> / <a href="https://www.reddit.com/r/HFY/wiki/series" target="_blank">All Series</a></p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;- If <span style="color:red">repeat</span> series name, format is "[series](series_author) [*author*]" </p>
<hr/>
                    series name: <input type="text" id="seriesname" value="" /> (Hit enter to submit)
                    <br/><b>Existing series names:</b> <span id="NumSerWikitool" style="color:navy; background-color:lightgreen"></span><span id="n-gram" style="color:forestgreen">there's nothing here</span>
                    <p>Other submissions:  &nbsp; &nbsp; <a onclick="$('.otherposts').toggle()">hide other</a></p>
                    <div class="otherposts" style="border:1px solid gray; background:Lavender; max-height:250px; overflow-y:auto; overflow-x:auto;">
                        <pre><span id="otherposts"></span></pre>
                    </div>
                    <p>&nbsp;</p>
                    <div class="endOfModal">
                    </div>
                </div>
            </div>
        `);

        //add in the button and its contents and format css elements
        $(".expando").prepend(Btn);
        $("body").append(BtnContent);
        $(".modal").modal();
        $(".modal-content").modalContent();

        //selecting everything inside each <pre> tag (the good stuff)
        var preTags = document.getElementsByTagName('pre');
        for(var i=0;i<preTags.length;i++) {
            preTags[i].onclick = function() {selectText(this)};
        }


        $("#myBtn").click(function() {
	        $(".modal").css("display","block");
            $('body').css("overflow", "hidden");
	    }); // When the user clicks the button, open the modal

        $('.close')[0].onclick = function() {
            $('.modal').css("display","none");
            $('body').css("overflow", "auto");
        }; // When the user clicks on <span> (x), close the modal

        window.onclick = function(event) {
            if (event.target == $('.modal')[0]) {
                $('.modal').css("display","none");
                $('body').css("overflow", "auto");
            } //for WikiTool
            if (event.target == $('.modalbackground')[0]) {
                $('.modalbackground').css("display","none");
                $('body').css("overflow", "auto");
            } //for Analysis because reasons (only one "onclick" command is allowed at a time, so you have to check for both)
        }; // close the modal if the user clicks outside the modal content

        function add(page, author) {
            $.post(`https://${domain}/r/HFY/api/wiki/alloweditor/add`, { page: page, username: author, uh: modhash }) // add author to list of users allowed to edit wiki page
              .done(function() {
                  $("#foostatus").html("boop");
              })
              .fail(function (err) {
                  alert(`error setting wiki page permissions on page: ${page} \n ${err}`);
                  $("#foostatus").html("Ruh-Roo");
              }); //end permissions fail
        } //end add permissions

	//getting the json with the information
        var lastID = null;
        var totalSubmissions = 0;
        var hfycount = 0;
        var storycount = 0;
        var metacount = 0;
        var NSFWcount = 0;
        var modremovedcount = 0;

        var officialcount = 0;

        var sentence = "";

        function load(after) {
            $.getJSON(`https://www.reddit.com/user/${author}/submitted.json?sort=new&limit=100&after=${after}`, function (foo) {
                var children = foo.data.children;
                var date;
                $.each(children, function (i, post) {
                    if (post.data.subreddit == "HFY"){
                        date = timeConvert(post.data.created_utc);
                        hfycount++;
                        var flair = post.data.link_flair_css_class;
                        var leng = (post.data.selftext).length;
                        if ((flair == "META") || (flair == "Text") || (flair == "Misc") || (flair == "Video") || (post.data.link_flair_text == "WP")){ //WP needs a special case because reasons. Meta used to be META. Also, there used to be a "meta mod" flair
                            if ((!post.data.removed) && (!post.data.banned_by)){ //"banned_by" is the older version of "removed" apparently
                                $("#otherposts").prepend( `<label>${metacount+1} <a href="https://redd.it/${post.data.id}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n</label>` );
                                metacount++;
                            } else {
                                $("#otherposts").prepend( `<label>** <a style="color:orange" href="https://redd.it/${post.data.id}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score}">` + post.data.title + `</a>\n</label>` );
                            }; //end if not removed
//                            if (post.data.title.includes("Writing Prompt") || post.data.title.includes("MWC") || post.data.title.includes("End of Month") ){ officialcount++; }; //for Ted and Nano
                        } else {
                            if ((!post.data.removed) && (!post.data.banned_by)){ //"banned_by" is the older version of "removed" apparently
                                if (post.data.over_18) {
                                    $("#stories").prepend( `<label>* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score},  pagecount: ${leng/2000}">` + (post.data.title).replace(`[OC]`, '').replace(`[oc]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>]<span style="color:purple">(` + post.data.url + `)</span> <emphasis style="color:red;">*NSFW*</emphasis>\n</label>` );
                                    NSFWcount++;
                                } else {
                                    $("#stories").prepend( `<label>* [<a href="${post.data.url}" title="flair: ${post.data.link_flair_text},  created: ${date},  score: ${post.data.score},  pagecount: ${leng/2000}">` + (post.data.title).replace(`[OC]`, '').replace(`[oc]`, '').replace(`(OC)`, '').replace(`[PI]`, '').trim() + `</a>](` + post.data.url + `)\n</label>` );
                                } //end if NSFW
                                storycount++;
                                sentence += `${(post.data.title).replace(`[OC]`, '').replace(`[oc]`, '').replace(`(OC)`, '').replace(`[PI]`, '').replace(`[`, '').replace(`]`, '').toLowerCase().trim()} `; //.replace(/[0-9]/g, '')
                            } else {
                                modremovedcount++;
                            }; //end if not removed
                        } //end if flaired
                    } //end if HFY
                    $('#hfycount').html(`${hfycount-modremovedcount}`);
                    $('#storycount').html(`${storycount}`);
                    $('#metacount').html(`${metacount}`);
                    $('#modremovedcount').html(`${modremovedcount}`);
                    $('#NSFWcount').html(`${NSFWcount}`); //update numbers
//                    $('#NSFWcount').html(`${officialcount}`); //update numbers
                });
                if (children && children.length > 0) {
                    lastID = children[children.length - 1].data.name;
                    totalSubmissions += children.length;
                    $('#totalSubmissions').html(`${totalSubmissions-modremovedcount}`);
                    load(lastID);
                } else {
//                    $("#n-gram").html(ngram(sentence));
                };
                if (storycount == 0) {
                    $('.authorpage').hide();
                } else {
                    $('.authorpage').show();
                };
            })
            .done(function() {
                check(author);
            })
            .error(function() {
                $("#YN").html( `- ERROR`);

                if (author == "[deleted]") {
                    $("#stories").append( `<span style="color:red">ERROR - ACCOUNT DELETED</span>`);
                } else {
                    $("#stories").append( `<span style="color:red">ERROR ... Shadowbanned?</span>`);
                }
            }); //end error
        } //end load

        function check(author) {
            var Contents;
            $.getJSON(`https://www.reddit.com/r/HFY/wiki/authors/${author}.json`, function (bar) {
                Contents = bar.data.content_md.toLowerCase();

                seriesCounter = 0;
                var result = getFromBetween.get(Contents,"/r/hfy/wiki/series/",")");
                $("#n-gram").html(result); //overwrites the suggested series area
                $("#NumSerWikitool").html(seriesCounter);

                $("#existsYN").html( `<span style="color:red">It exists - </span> <a href="https://www.reddit.com/r/HFY/wiki/edit/authors/${author}" target="_blank">Edit?</a>`);
                $("#YN").html( `- Exists`);
            })
            .error(function() {
                $("#existsYN").html( `<span style="color:red">Does not exist. <a href="https://www.reddit.com/r/HFY/wiki/create/authors/${author}" target="_blank">Create?</a></span> ... `);
                $("#YN").html( ` - <span style="color:red">${storycount}</span>`);
            }); //end error
        } //end check exists

//        check(author);
        load(lastID);

//---------------------------------------Series----------------------------------------------

        // When user enters the series
        var series;
        var series_;
        var seriesURL = [];
        var seriescount = 0;
        var serieslength;
        var seriesContent = (`
            <hr/>
            <p>Series no. <span id="series-count" style="color:blue">${seriescount}</span>  has <span id="entrycount" style="color:red"></span> stories  &nbsp; &nbsp; <a id="seriesclick" onclick="$('#seriespage').toggle()">hide <i>this</i> series page</a></p>
            <div id="seriespage" style="border:1px solid gray; background:Lavender; max-height:250px; overflow-y:auto; overflow-x:auto;"><pre>
[**${author.split("_").join("\\_")}**](/r/HFY/wiki/authors/${author.toLowerCase()})

##**<a id="seriesURL"><span id="series-header">Series</span></a>**
<span id="seriesStories"></span>
&amp;nbsp;

---
[All Series](https://www.reddit.com/r/HFY/wiki/series)
</pre>
            </div>
        `);

        function doublecheck(series, author, seriescount) {
            var content = "belp? ";
            $.getJSON(`https://www.reddit.com/r/hfy/wiki/series/${series}.json`, function (bar) {
                content = bar.data.content_md;
            })
              .done(function() {
                if ( content.includes(author) ) { //exists, and under this author
                    $("#seriesURL-" + seriescount)[0].style.color = 'olive'; //link at the top of the Series page
                    $("#authorseries-" + seriescount)[0].style.color = 'olive'; //link on the Authors page

                } else { //exists, but NOT under this author
                    $("#seriesURL-" + seriescount)[0].style.color = 'red'; //link at the top of the Series page
                    $("#seriesURL-" + seriescount)[0].setAttribute('href', `https://www.reddit.com/r/HFY/wiki/series/${series_ + "_" + author.toLowerCase()}`);
                    $("#authorseries-" + seriescount)[0].style.color = 'red'; //link on the Authors page
                    $("#authorseries-" + seriescount)[0].setAttribute('href', `https://www.reddit.com/r/HFY/wiki/series/${series_ + "_" + author.toLowerCase()}`);
                    $("#authorseriesURL-" + seriescount)[0].append("_" + author.toLowerCase());
                };
              })
            .error(function() {
//                    $("#existsYN").prepend(`c=oops `);
            }); //end error
        } //end doublecheck (for series) if exists

        $("#seriesname").keyup(function(e){
            var code = e.which; // recommended to use e.which, it's normalized across browsers
            if(code==13)e.preventDefault();
            if(code==13){ //13=enter
                series = $(this).val().toString(); //$('#storycount').html($('#stories')[0].innerHTML);
                series_ = series.toLowerCase().replace(/\s/g, '_').replace(/['!"#$\-%&\\'()\*+,\.\/:;<=>?@\[\\\]\^`{|}~']/g,""); //the url, to be not case-sensitive
                $(this).val(''); //reset input field
                seriescount++;
                if (seriescount == 1) {
                    $("#serieslabel").prepend(`##**Series** \n<span id="author-series"></span>`); //add header for series list to Author page
                }
                $(".endOfModal").prepend(seriesContent); //for some reason the numbering gets reverse if you append //reason now known, too lazy to fix
                $('#series-count').attr("id", "series-count-" + seriescount).html(`${seriescount}`); //gives each series template a unique id //$(`span[id*= ${seriescount}]`)
                $('#seriespage').attr("id", "seriespage-" + seriescount);
                $('a#seriesclick').attr("id", "seriesclick-" + seriescount).attr("onclick", `$("#seriespage-" + ${seriescount}).toggle()`); //makes sure it the "Hides" hide the right section
                $('a#seriesURL').attr("id", "seriesURL-" + seriescount).attr("href", `https://www.reddit.com/r/HFY/wiki/series/${series_}`); //changes URL at the top of Series page
                $("#author-series").append( `####[<a href="https://www.reddit.com/r/HFY/wiki/series/${series_}" target="_blank" id="authorseries-${seriescount}">${series.toProperCase()}</a>](<span id="authorseriesURL-${seriescount}">/r/HFY/wiki/series/${series_}</span>)\n` ); //add this series to the list on the Author page
                $("#series-header").html(`${series.toProperCase()}`); //names of series on Series Page
                seriesURL.push(`* [${series.toProperCase()}](/r/HFY/wiki/series/${series_})\n\n`); //add new series to the list for message
                MessageURL = encodeURIComponent(preface + seriesURL.join("") + postface); //encodeURI
                $("a#message").attr("href", `https://www.reddit.com/message/compose/?to=${author}&subject=HFY+Wiki&message=${MessageURL}`);

                doublecheck(series, author, seriescount);
                $("#stories label:contains('" + series + "'), #stories label:contains('" + series_ + "')").clone().appendTo("#seriesStories"); //contains series or series_, copy them
                serieslength = $("#stories label:contains('" + series + "'), #stories label:contains('" + series_ + "')").css("display","none").length; //hide the originals and find out how many
                $("#entrycount").html(`${serieslength}`);
            }

            //selecting everything inside each <pre> tag (the good stuff)
            var preTags = document.getElementsByTagName('pre');
            for(var i=0;i<preTags.length;i++) {
                preTags[i].onclick = function() {selectText(this)};
            }
        }); //end get series

    }); //document ready

})();
