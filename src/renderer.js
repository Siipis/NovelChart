// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const electron = require('electron').remote;
const fs = require('fs');
const Chart = require('chart.js');
const encoding = require('windows-1252');

let chart = null;

document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('chart');

    chart = new Chart(canvas, {
        type: 'line',
        data: [],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            animation: {
                duration: 0 // general animation time
            },
            hover: {
                animationDuration: 0 // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0 // animation duration after a resize
        }
    });
});

function openOutline() {
    const files = electron.dialog.showOpenDialog({
        title: 'Open Scrivener Outline',
        filters: [
            {
                name: 'Outlines',
                extensions: ['txt']
            }
        ],
        properties: ['openFile']
    }, function (fileNames) {
        if (fileNames === undefined) return;

        const filename = fileNames[0];

        let labels = [];
        let values = [];

        fs.readFile(filename, function (err, buffer) {
            if (err) throw err;

            const data = encoding.decode(buffer.toString('binary'));

            const lines = data.split('\n');

            let currentLabel = '';
            let currentMood = 0;

            for (const line of lines) {
                if (line.length === 0) continue;

                if (line.match('\^[0-9]+\. *')) {
                    currentLabel = line;
                }

                if (line.match('\^Mood:')) {
                    const matches = line.match('\^Mood:\t([-]?[0-9]+)');

                    const mood = parseInt(matches[1]);
                    const value = currentMood + mood;

                    labels.push(currentLabel);
                    values.push(value);

                    currentMood = value; // Store for next scene
                }
            }

            if (labels.length === 0) {
                electron.dialog.showMessageBox({
                    type: 'error',
                    title: 'Outline not found',
                    message: 'The file you selected contained no data. \n\nPlease ensure your outline contains a mood line, eg. "Mood: 0".'
                })
            } else {
                chart.data = {
                    labels: labels,
                    datasets: [{
                        label: 'Mood',
                        data: values,
                        borderWidth: 1
                    }]
                };

                chart.update();
            }
        });
    });
}