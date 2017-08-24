var BANDS = new Object();
BANDS["A"] = [5865,5845,5825,5805,5785,5765,5745,5725];
BANDS["B"] = [5733,5752,5771,5790,5809,5828,5847,5866];
BANDS["E"] = [5705,5685,5665,5645,5885,5905,5925,5945];
BANDS["F"] = [5740,5760,5780,5800,5820,5840,5860,5880];
BANDS["R"] = [5658,5695,5732,5769,5806,5843,5880,5917];

function findFreq(input) {
    for (var band in BANDS) {
        if (BANDS[band].indexOf(input) >= 0) {
            return band + (BANDS[band].indexOf(input) + 1);
        }
    }
    return "";
}

function findChannel(band, freq) {
    return BANDS[band].indexOf(freq) + 1;
}

function getMinDisVector(solution) {
    var vector = [1000000, 1000000, 0];
    var freqsIMD =[];
    for (var i = 0; i < solution.length; i++) {
        for (var j = 0; j < solution.length; j++) {
            if (i != j) {
                vector[0] = Math.min(vector[0], Math.abs(solution[i] - solution[j]));
                if (vector[0] == 0) return [0,0,0];
                freqsIMD.push((solution[i] * 2) - solution[j]);
            }
        }
    }
    for (var i = 0; i < solution.length; i++) {
        for (var j = 0; j < freqsIMD.length; j++) {
           if (freqsIMD[j] < 5100 || freqsIMD[j] > 6099) continue;
           var diff = Math.abs(freqsIMD[j] - solution[i]);
           vector[1] = Math.min(vector[1], diff);
           if (vector[1] == 0) {
               vector[2] = 0;
               return vector;
           }
           if (diff < 35) {
               vector[2] += (35 - diff) * (35 - diff);
           }
        }
    }
    vector[2] = Math.round(100 - vector[2]/5/solution.length);
    return vector;
}

function getMinDisCoeff(solution) {
    var vector = getMinDisVector(solution);
    return vector[0] + vector[1];
}

function buildFreqDescriptor(freqs) {
    var result = new Object();
    result.freqs = freqs.slice();
    result.freqsH = result.freqs.map(function(e) {return findFreq(e);});
    result.freqsS = freqs.slice().sort();
    var vector = getMinDisVector(result.freqs);
    result.minDis = vector[0];
    result.maxDis = result.freqsS[result.freqsS.length - 1] - result.freqsS[0];
    result.imdMinDis = vector[1];
    result.imdRating = vector[2];
    return result;
}

function calculateFreqLayout(pilots) {
    var solution = pilots.map(function (e) {
        return e[0];
    });
    var remainingP = pilots.slice(1);
    var finalSolution = solution;
    for (var i = 0; i < pilots[0].length; i++) {
        var newSolution =[];
        newSolution.push(pilots[0][i]);
        finalSolution = calculateFreqLayoutR(remainingP, newSolution, finalSolution, getMinDisCoeff(finalSolution));
    }
    return buildFreqDescriptor(finalSolution);
}

function calculateFreqLayoutR(remainingP, newSolution, solution, minDis) {
    for (var i = 0; i < remainingP[0].length; i++) {
        var newSolutionCopy = newSolution.slice();
        newSolutionCopy.push(remainingP[0][i]);
        var newMinDis = getMinDisCoeff(newSolutionCopy);
        if (minDis < newMinDis) {
            if (remainingP.length == 1) {
                minDis = newMinDis;
                solution = newSolutionCopy;
            } else {
                var newRemainingP = remainingP.slice(1);
                solution = calculateFreqLayoutR(newRemainingP, newSolutionCopy, solution, minDis);
                minDis = getMinDisCoeff(solution);
            }
        }
    }
    return solution;
}

var PILOTS =[];
var COUNTER = 0;

function addPilot() {
    var pilot = new Object();
    pilot.id = COUNTER++;
    pilot.index = PILOTS.length;
    pilot.uiID = "pilot-" + pilot.id;
    pilot.name = "Pilot " + pilot.id;
    pilot.freqs =[];
    pilot.freq = 0;
    PILOTS.push(pilot);
    return pilot;
}

function removePilot(i) {
    PILOTS.splice(i, 1);
}

function setPilotName(i, name) {
    PILOTS[i].name = name;
}

function setPilotFreqs(i, freqs) {
    PILOTS[i].freqs = freqs.slice();
}

function setPilotFreq(i, freq) {
    PILOTS[i].freq = freq;
}

function getPilotFreq(i) {
    return PILOTS[i].freq;
}

function getPilotAvailableFreqs() {
    return PILOTS.map(function(e){return e.freqs;});
}

function setPilotFreqLayout(layout) {
    for (var i = 0; i < layout.freqs.length; i++) {
        setPilotFreq(i, layout.freqs[i]);
    }
}

function buildPilotWidget$(pilot) {
    var els = "";
    els += "<div class='ui-body ui-corner-all pilot' id='"+pilot.id+"' style='background-color:#e9e9e9;margin-bottom:0.4em;'>";
    els +=     "<div class='ui-grid-b'>";
    els +=         "<div class='ui-block-a'>";
    els +=             "<div class='ui-field-contain'><label for='"+pilot.uiID+"-name' class='ui-hidden-accessible'>Name:</label><input type='text' id='"+pilot.uiID+"-name' value='"+pilot.name+"' class='selector-name'></input></div>";
    els +=             "<div class='ui-field-contain'><label style='margin-top:0.75em;' for='"+pilot.uiID+"-frequency'>Frequency:</label><h3 id='"+pilot.uiID+"-frequency' class='display-frequency'>--</h3></div>";
    els +=         "</div>";
    els +=         "<div class='ui-block-b'>";
    els +=             "<div data-role='controlgroup'>";
    for (band in BANDS) {
        els +=             "<label for='"+pilot.uiID+"-band"+band+"'>Band "+band+"</label><input type='checkbox' id='"+pilot.uiID+"-band"+band+"' band='"+band+"' class='selector-band'></input>";
    }
    els +=             "</div>";
    els +=         "</div>";
    els +=         "<div class='ui-block-c' style='text-align:right;'>";
    els +=             "<div class='ui-field-contain'><label for='"+pilot.uiID+"-fixed'>Fixed:</label><input data-role='flipswitch' type='checkbox' id='"+pilot.uiID+"-fixed' class='selector-fixed'></input></div>";
    els +=             "<div class='ui-field-contain' style='display:none;'><label for='"+pilot.uiID+"-channel'>Channel:</label>";
    els +=             "<select id='"+pilot.uiID+"-channel' data-inline='true' class='selector-channel'>";
    for (var channel = 1; channel <=8; channel++) {
        els +=             "<option value='"+channel+"'>"+channel+"</option>";
    }
    els +=             "</select></div>";
    els +=         "</div>";
    els +=     "</div>";
    els += "</div>";
    return $(els);
}

function getIndex($widget) {
    return $(".pilot").index($widget);
}

function getPilotWidget$(e) {
    return $(e).parents(".pilot");
}


function getSelector$(i, suffix) {
    return $("#"+PILOTS[i].uiID+"-"+suffix);
}

function setupListeners($widget) {
    $widget.on("swipe", function(e){
        var $widget = $(this);
        var i = getIndex($widget);
        removePilot(i);
        $widget.remove();
        $("#pilots").controlgroup("refresh");
        calculateFreqs();
    })
    $widget.find(".selector-band").on("change", function (e) {
        var $widget = getPilotWidget$(this);
        var i = getIndex($widget);
        var fixed = getSelector$(i, "fixed").prop("checked");
        if (fixed) {
            $widget.find(".selector-band[band!='"+$(this).attr("band")+"']").each(function() {
                $(this).prop("checked", false);
                $(this).checkboxradio("refresh");
            });
            $(this).prop("checked", true);
        }
        var freqs = [];
        if (fixed) {
            freqs.push(BANDS[$(this).attr("band")][$widget.data("channel") ? $widget.data("channel")-1 : 0]);
        } else {
            $widget.find(".selector-band:checked").each(function() {
                freqs = freqs.concat(BANDS[$(this).attr("band")]);
            });
        }
        setPilotFreqs(i, freqs);
        calculateFreqs();
    });
    $widget.find(".selector-fixed").on("change", function(e) {
        var $widget = getPilotWidget$(this);
        var i = getIndex($widget);
        var fixed = $(this).prop("checked");
        if (fixed) {
            getSelector$(i, "channel").parents(".ui-field-contain:first").show();
            $widget.find(".selector-band[band!='"+$widget.data("band")+"']").each(function() {
                $(this).prop("checked", false);
                $(this).checkboxradio("refresh");
            });
            setPilotFreqs(i, $widget.data("freq") ? [$widget.data("freq")] : []);
        } else {
            getSelector$(i, "channel").parents(".ui-field-contain:first").hide();
            setPilotFreqs(i, $widget.data("band") ? BANDS[$widget.data("band")] : []);
        }
        calculateFreqs();
    });
    $widget.find(".selector-channel").on("change", function(e) {
        var $widget = getPilotWidget$(this);
        var i = getIndex($widget);
        setPilotFreqs(i, [BANDS[$widget.data("band")][$(this).val() - 1]]);
        calculateFreqs();
    });
		$widget.find(".selector-name").on("blur", function(e) {
				var $widget = getPilotWidget$(this);
        var i = getIndex($widget);
				setPilotName(i, $(this).val());
	  });
}

function calculateFreqs() {
    var availableFreqs = getPilotAvailableFreqs();
    if (availableFreqs.length < 2 || availableFreqs.map(function (e) {return e.length;}).indexOf(0) >= 0) {
        $(".pilot").each(function(i, e) {
            $(this).data("band", null);
            $(this).data("channel", null);
            $(this).data("freq", null);
            getSelector$(i, "frequency").html("--");
            getSelector$(i, "channel").val([]).selectmenu("refresh");
        });
        $("#display-minDis").html("-- MHz");
        $("#display-imdMinDis").html("-- MHz");
        $("#display-imdRating").html("--");
        $("#display-maxDis").html("-- MHz");
        return;
    }
    var freqLayout = calculateFreqLayout(availableFreqs);
    setPilotFreqLayout(freqLayout);
    $(".pilot").each(function(i, e) {
        var freq = getPilotFreq(i);
        var band;
        var channel;
        $(this).find(".selector-band:checked").each(function() {
            var selectedBand = $(this).attr("band");
            var foundChannel = findChannel(selectedBand, freq);
            if (foundChannel > 0) { 
                band = selectedBand;
                channel = foundChannel;
            }
        });
        $(this).data("band", band);
        $(this).data("channel", channel);
        $(this).data("freq", freq);
        getSelector$(i, "frequency").html(band+(channel + "")+" - "+freq);
        getSelector$(i, "channel").val(channel).selectmenu("refresh");
    });
    $("#display-minDis").html(freqLayout.minDis + " MHz");
    $("#display-imdMinDis").html(freqLayout.imdMinDis + " MHz");
    $("#display-imdRating").html(freqLayout.imdRating);
    $("#display-maxDis").html(freqLayout.maxDis + " MHz");
}

( function( $, undefined ) {
$( document ).bind( "pagecreate", function( e ) {
    $( "#append", e.target ).on( "click", function( e ) {
        var pilot = addPilot();
        var $pilots = $("#pilots");
        var $widget = buildPilotWidget$(pilot);
        setupListeners($widget);
        $widget.appendTo($pilots.controlgroup("container")).enhanceWithin();
        $pilots.controlgroup("refresh");
        calculateFreqs();
    });
});
})( jQuery );
