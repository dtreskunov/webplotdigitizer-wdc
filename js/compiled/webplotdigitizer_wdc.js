if(typeof Math.imul == "undefined" || (Math.imul(0xffffffff,5) == 0)) {
    Math.imul = function (a, b) {
        var ah  = (a >>> 16) & 0xffff;
        var al = a & 0xffff;
        var bh  = (b >>> 16) & 0xffff;
        var bl = b & 0xffff;
        // the shift by 0 fixes the sign on the high part
        // the final |0 converts the unsigned value into a signed value
        return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)|0);
    }
}

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.initApp = function() {// This is run when the page loads.

    wpd.browserInfo.checkBrowser();
    wpd.layoutManager.initialLayout();
    if(!wpd.loadRemoteData()) {
        wpd.graphicsWidget.loadImageFromURL('start.png');
        //wpd.messagePopup.show(wpd.gettext('unstable-version-warning'), wpd.gettext('unstable-version-warning-text'));
    }
    document.getElementById('loadingCurtain').style.display = 'none';

};

wpd.loadRemoteData = function() {

    if(typeof wpdremote === "undefined") { 
        return false; 
    }
    if(wpdremote.status != null && wpdremote.status === 'fail') {
        wpd.messagePopup.show('Remote Upload Failed!', 'Remote Upload Failed!');
        return false;
    }
    if(wpdremote.status === 'success' && wpdremote.localUrl != null) {
        wpd.graphicsWidget.loadImageFromURL(wpdremote.localUrl);
        wpd.popup.show('axesList');
        return true;
    }
    return false;
};

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};
// maintain and manage current state of the application
wpd.appData = (function () {
    var isAligned = false,
        plotData;

    function reset() {
        isAligned = false;
        plotData = null;
    }

    function getPlotData() {
        if(plotData == null) {
            plotData = new wpd.PlotData();
        }
        return plotData;
    }

    function isAlignedFn(is_aligned) {
        if(is_aligned != null) {
            isAligned = is_aligned;
        }
        return isAligned;
    }

    function plotLoaded(imageData) {
        getPlotData().topColors = wpd.colorAnalyzer.getTopColors(imageData);
    }

    return {
        isAligned: isAlignedFn,
        getPlotData: getPlotData,
        reset: reset,
        plotLoaded: plotLoaded
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.AutoDetector = (function () {
    var obj = function () {

        this.fgColor = [0, 0, 200];
        this.bgColor = [255, 255, 255];
        this.mask = null;
        this.gridMask = { xmin: null, xmax: null, ymin: null, ymax: null, pixels: [] };
        this.gridLineColor = [255, 255, 255];
        this.gridColorDistance = 10;
        this.gridData = null;
        this.colorDetectionMode = 'fg';
        this.colorDistance = 120;
        this.algorithm = null;
        this.binaryData = null;
        this.gridBinaryData = null;
        this.imageData = null;
        this.imageWidth = 0;
        this.imageHeight = 0;
        this.gridBackgroundMode = true;
        
        this.reset = function () {
            this.mask = null;
            this.binaryData = null;
            this.imageData = null;
            this.gridData = null;
            this.gridMask = { xmin: null, xmax: null, ymin: null, ymax: null, pixels: [] };
        };

        this.generateBinaryDataFromMask = function () {

            var maski, img_index, dist, ir, ig, ib, ia,
                ref_color = this.colorDetectionMode === 'fg' ? this.fgColor : this.bgColor;

            for(maski = 0; maski < this.mask.length; maski++) {
                img_index = this.mask[maski];
                ir = this.imageData.data[img_index*4];
                ig = this.imageData.data[img_index*4+1];
                ib = this.imageData.data[img_index*4+2];
                ia = this.imageData.data[img_index*4+3];
                if(ia === 0) { // for transparent images, assume white RGB
                    ir = 255; ig = 255; ib = 255;
                }

                dist = wpd.dist3d(ir, ig, ib, ref_color[0], ref_color[1], ref_color[2]);

                if(this.colorDetectionMode === 'fg') {
                    if(dist <= this.colorDistance) {
                        this.binaryData[img_index] = true;
                    }
                } else {
                    if(dist >= this.colorDistance) {
                        this.binaryData[img_index] = true;
                    }
                }
            }
        };

        this.generateBinaryDataUsingFullImage = function () {
            
            var dist, img_index,
                ref_color = this.colorDetectionMode === 'fg' ? this.fgColor : this.bgColor,
                ir,ig,ib,ia; 

            for(img_index = 0; img_index < this.imageData.data.length/4; img_index++) {
                ir = this.imageData.data[img_index*4];
                ig = this.imageData.data[img_index*4+1];
                ib = this.imageData.data[img_index*4+2];
                ia = this.imageData.data[img_index*4+3];

                // If image is transparent, then assume white background.
                if(ia === 0) {
                    ir = 255; ig = 255; ib = 255;
                }
                
                dist = wpd.dist3d(ir, ig, ib, ref_color[0], ref_color[1], ref_color[2]);           

                if(this.colorDetectionMode === 'fg') {
                    if(dist <= this.colorDistance) {
                        this.binaryData[img_index] = true;
                    }
                } else {
                    if(dist >= this.colorDistance) {
                        this.binaryData[img_index] = true;
                    }
                }
            }
        };

        this.generateBinaryData = function () {

            this.binaryData = [];

            if(this.imageData == null) {
                this.imageHeight = 0;
                this.imageWidth = 0;
                return;
            }

            this.imageHeight = this.imageData.height;
            this.imageWidth = this.imageData.width;

            if (this.mask == null || this.mask.length === 0) {
                this.generateBinaryDataUsingFullImage();
            } else {
                this.generateBinaryDataFromMask();
            }
        };

        this.generateGridBinaryData = function () {
            this.gridBinaryData = [];

            if (this.imageData == null) {
                this.imageWidth = 0;
                this.imageHeight = 0;
                return;
            }
            
            this.imageWidth = this.imageData.width;
            this.imageHeight = this.imageData.height;

            var xi, yi, dist, img_index, maski, ir, ig, ib, ia;

            if (this.gridMask.pixels == null || this.gridMask.pixels.length === 0) {
                // Use full image if no mask is present
                maski = 0;
                this.gridMask.pixels = [];
                for(yi = 0; yi < this.imageHeight; yi++) {
                    for(xi = 0; xi < this.imageWidth; xi++) {
                        img_index = yi*this.imageWidth + xi;
                        ir = this.imageData.data[img_index*4];
                        ig = this.imageData.data[img_index*4+1];
                        ib = this.imageData.data[img_index*4+2];
                        ia = this.imageData.data[img_index*4+3];

                        if(ia === 0) { // assume white color when image is transparent
                            ir = 255; ig = 255; ib = 255;
                        }

                        dist = wpd.dist3d(this.gridLineColor[0], this.gridLineColor[1], this.gridLineColor[2], ir, ig, ib);
                        
                        if(this.gridBackgroundMode) {
                            if (dist > this.gridColorDistance) {
                                this.gridBinaryData[img_index] = true;
                                this.gridMask.pixels[maski] = img_index;
                                maski++;
                            }
                        } else {
                            if (dist < this.gridColorDistance) {
                                this.gridBinaryData[img_index] = true;
                                this.gridMask.pixels[maski] = img_index;
                                maski++;
                            }
                        }
                    }
                }
                this.gridMask.xmin = 0;
                this.gridMask.xmax = this.imageWidth;
                this.gridMask.ymin = 0;
                this.gridMask.ymax = this.imageHeight;
                return;
            }

            for (maski = 0; maski < this.gridMask.pixels.length; maski++) {
                img_index = this.gridMask.pixels[maski];
                ir = this.imageData.data[img_index*4];
                ig = this.imageData.data[img_index*4+1];
                ib = this.imageData.data[img_index*4+2];
                ia = this.imageData.data[img_index*4+3];

                dist = wpd.dist3d(this.gridLineColor[0], this.gridLineColor[1], this.gridLineColor[2], ir, ig, ib);

                if(this.gridBackgroundMode) {
                    if (dist > this.gridColorDistance) {
                        this.gridBinaryData[img_index] = true;
                    }
                } else {
                    if (dist < this.gridColorDistance) {
                        this.gridBinaryData[img_index] = true;
                    }
                }
            }
        };

    };
    return obj;
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// calibration info
wpd.Calibration = (function () {

    var Calib = function(dim) {
        // Pixel information
        var px = [],
            py = [],

            // Data information
            dimensions = dim == null ? 2 : dim,
            dp = [],
            selections = [];

        this.labels = [];

        this.getCount = function () { return px.length; };
        this.getDimensions = function() { return dimensions; };
        this.addPoint = function(pxi, pyi, dxi, dyi, dzi) {
            var plen = px.length, dlen = dp.length;
            px[plen] = pxi;
            py[plen] = pyi;
            dp[dlen] = dxi; dp[dlen+1] = dyi;
            if(dimensions === 3) {
                dp[dlen+2] = dzi;
            }
        };

        this.getPoint = function(index) {
            if(index < 0 || index >= px.length) return null;

            return {
                px: px[index],
                py: py[index],
                dx: dp[dimensions*index],
                dy: dp[dimensions*index+1],
                dz: dimensions === 2 ? null : dp[dimensions*index + 2]
            };
        };

        this.changePointPx = function(index, npx, npy) {
            if(index < 0 || index >= px.length) {
                return;
            }
            px[index] = npx;
            py[index] = npy;
        };

        this.setDataAt = function(index, dxi, dyi, dzi) {
            if(index < 0 || index >= px.length) return;
            dp[dimensions*index] = dxi;
            dp[dimensions*index + 1] = dyi;
            if(dimensions === 3) {
                dp[dimensions*index + 2] = dzi;
            }
        };

        this.findNearestPoint = function(x, y, threshold) {
            threshold = (threshold == null) ? 50 : parseFloat(threshold);
            var minDist, minIndex = -1, 
                i, dist;
            for(i = 0; i < px.length; i++) {
                dist = Math.sqrt((x - px[i])*(x - px[i]) + (y - py[i])*(y - py[i]));
                if((minIndex < 0 && dist <= threshold) || (minIndex >= 0 && dist < minDist)) {
                    minIndex = i;
                    minDist = dist;
                }
            }
            return minIndex;
        };


        this.selectPoint = function(index) {
            if(selections.indexOf(index) < 0) {
                selections[selections.length] = index;
            }
        };

        this.selectNearestPoint = function (x, y, threshold) {
            var minIndex = this.findNearestPoint(x, y, threshold);
            if (minIndex >= 0) {
                this.selectPoint(minIndex);
            }
        };

        this.getSelectedPoints = function () {
            return selections;
        };

        this.unselectAll = function() {
            selections = [];
        };

        this.isPointSelected = function(index) {
            return selections.indexOf(index) >= 0;
        };

        this.dump = function() {
            console.log(px);
            console.log(py);
            console.log(dp);
        };
    };
    return Calib;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

wpd = wpd || {};

wpd.ColorGroup = (function () {
    var CGroup = function(tolerance) {
        
        var totalPixelCount = 0,
            averageColor = {r: 0, g: 0, b: 0};
        
        tolerance = tolerance == null ? 100 : tolerance;

        this.getPixelCount = function () {
            return totalPixelCount;
        };

        this.getAverageColor = function () {
            return averageColor;
        };

        this.isColorInGroup = function (r, g, b) {
            if (totalPixelCount === 0) {
                return true;
            }

            var dist = (averageColor.r - r)*(averageColor.r - r) + (averageColor.g - g)*(averageColor.g - g) + (averageColor.b - b)*(averageColor.b - b);

            return (dist <= tolerance*tolerance);
        };

        this.addPixel = function (r, g, b) {
            averageColor.r = (averageColor.r*totalPixelCount + r)/(totalPixelCount + 1.0);
            averageColor.g = (averageColor.g*totalPixelCount + g)/(totalPixelCount + 1.0);
            averageColor.b = (averageColor.b*totalPixelCount + b)/(totalPixelCount + 1.0);
            totalPixelCount = totalPixelCount + 1;
        };

    };
    return CGroup;
})();



wpd.colorAnalyzer = (function () {

    function getTopColors (imageData) {

        var colorGroupColl = [], // collection of color groups
            pixi,
            r, g, b, a,
            groupi,
            groupMatched,
            rtnVal = [],
            avColor,
            tolerance = 120;

        colorGroupColl[0] = new wpd.ColorGroup(tolerance); // initial group
        
        for (pixi = 0; pixi < imageData.data.length; pixi += 4) {
            r = imageData.data[pixi];
            g = imageData.data[pixi + 1];
            b = imageData.data[pixi + 2];
            a = imageData.data[pixi + 3];
            if(a === 0) {
                r = 255; g = 255; b = 255;
            }

            groupMatched = false;

            for (groupi = 0; groupi < colorGroupColl.length; groupi++) {
                if (colorGroupColl[groupi].isColorInGroup(r, g, b)) {
                    colorGroupColl[groupi].addPixel(r, g, b);
                    groupMatched = true;
                    break;
                }
            }

            if (!groupMatched) {
                colorGroupColl[colorGroupColl.length] = new wpd.ColorGroup(tolerance);
                colorGroupColl[colorGroupColl.length - 1].addPixel(r, g, b);
            }
        }
        
        // sort groups
        colorGroupColl.sort(function(a, b) {
            if ( a.getPixelCount() > b.getPixelCount() ) {
                return -1;
            } else if (a.getPixelCount() < b.getPixelCount() ) {
                return 1;
            }
            return 0;
        });

        for (groupi = 0; groupi < colorGroupColl.length; groupi++) {
            
            avColor = colorGroupColl[groupi].getAverageColor();

            rtnVal[groupi] = {
                r: parseInt(avColor.r, 10),
                g: parseInt(avColor.g, 10),
                b: parseInt(avColor.b, 10),
                pixels: colorGroupColl[groupi].getPixelCount(),
                percentage: 100.0*colorGroupColl[groupi].getPixelCount()/(0.25*imageData.data.length)
            };
        }

        return rtnVal;
    }

    return {
        getTopColors: getTopColors
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.ConnectedPoints = (function () {
    var CPoints = function (connectivity) {

        var connections = [],
            selectedConnectionIndex = -1,
            selectedPointIndex = -1;

        this.addConnection = function (plist) {
            connections[connections.length] = plist;
        };

        this.clearAll = function () {
            connections = [];
        };

        this.getConnectionAt = function (index) {
            if(index < connections.length) {
                return connections[index];
            }   
        };

        this.replaceConnectionAt = function (index, plist) {
            if(index < connections.length) {
                connections[index] = plist;
            }
        };

        this.deleteConnectionAt = function (index) {
            if(index < connections.length) {
                connections.splice(index, 1);
            }
        };

        this.connectionCount = function () {
            return connections.length;
        };

        this.getDistance = function(index) {
            if(index < connections.length && connectivity === 2) {
                var dist = Math.sqrt((connections[index][0] - connections[index][2])*(connections[index][0] - connections[index][2])
                    + (connections[index][1] - connections[index][3])*(connections[index][1] - connections[index][3]));
                return dist; // this is in pixels!
            }
        };

        this.getAngle = function(index) {
            if(index < connections.length && connectivity === 3) {

                var ang1 = wpd.taninverse(-(connections[index][5] - connections[index][3]), connections[index][4] - connections[index][2]),
                    ang2 = wpd.taninverse(-(connections[index][1] - connections[index][3]), connections[index][0] - connections[index][2]),
                    ang = ang1 - ang2;

                ang = 180.0*ang/Math.PI;
                ang = ang < 0 ? ang + 360 : ang;
                return ang;
            }
        };

        this.getOpenSpline = function(index) {
            return null;
        };

        this.getClosedSpline = function(index) {
            return null;
        };

        this.openPathLength = function(index) {
            return 0;
        };

        this.closedPathLength = function(index) {
            return 0;
        };

        this.closedPathArea = function(index) {
            return 0;
        };

        this.findNearestPointAndConnection = function (x, y) {
            var minConnIndex = -1,
                minPointIndex = -1,
                minDist, dist,
                ci, pi;

            for (ci = 0; ci < connections.length; ci++) {
                for (pi = 0; pi < connectivity*2; pi+=2) {
                    dist = (connections[ci][pi] - x)*(connections[ci][pi] - x) + (connections[ci][pi+1] - y)*(connections[ci][pi+1] - y);
                    if (minPointIndex === -1 || dist < minDist) {
                        minConnIndex = ci;
                        minPointIndex = pi/2;
                        minDist = dist;
                    }
                }
            }

            return {
                connectionIndex: minConnIndex,
                pointIndex: minPointIndex
            };
        };

        this.selectNearestPoint = function (x, y) {
            var nearestPt = this.findNearestPointAndConnection(x, y);
            if (nearestPt.connectionIndex >= 0) {
                selectedConnectionIndex = nearestPt.connectionIndex;
                selectedPointIndex = nearestPt.pointIndex;
            }
        };

        this.deleteNearestConnection = function (x, y) {
            var nearestPt = this.findNearestPointAndConnection(x, y);
            if (nearestPt.connectionIndex >= 0) {
                this.deleteConnectionAt(nearestPt.connectionIndex);
            }
        };

        this.isPointSelected = function (connectionIndex, pointIndex) {
            if (selectedPointIndex === pointIndex && selectedConnectionIndex === connectionIndex) {
                return true;
            }
            return false;
        };

        this.getSelectedConnectionAndPoint = function () {
            return {
                connectionIndex: selectedConnectionIndex,
                pointIndex: selectedPointIndex
            };
        };

        this.unselectConnectionAndPoint = function () {
            selectedConnectionIndex = -1;
            selectedPointIndex = -1;
        };

        this.setPointAt = function (connectionIndex, pointIndex, x, y) {
            connections[connectionIndex][pointIndex*2] = x;
            connections[connectionIndex][pointIndex*2 + 1] = y;
        };

        this.getPointAt = function (connectionIndex, pointIndex) {
            return {
                x: connections[connectionIndex][pointIndex*2],
                y: connections[connectionIndex][pointIndex*2 + 1]
            };
        };
    };
    return CPoints;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// Data from a series
wpd.DataSeries = (function () {
    return function (dim) {
        var dataPoints = [],
            connections = [],
            selections = [],
            hasMetadata = false,
            mkeys = [];

        this.name = "Default Dataset";

        this.variableNames = ['x', 'y'];

        this.hasMetadata = function () {
            return hasMetadata;
        };

        this.setMetadataKeys = function (metakeys) {
            mkeys = metakeys;
        };

        this.getMetadataKeys = function () {
            return mkeys;
        };

        this.addPixel = function(pxi, pyi, mdata) {
            var dlen = dataPoints.length;
            dataPoints[dlen] = {x: pxi, y: pyi, metadata: mdata};
            if (mdata != null) {
                hasMetadata = true;
            }
        };

        this.getPixel = function(index) {
            return dataPoints[index];
        };

        this.setPixelAt = function (index, pxi, pyi) {
            if(index < dataPoints.length) {
                dataPoints[index].x = pxi;
                dataPoints[index].y = pyi;
            }
        };

        this.setMetadataAt = function (index, mdata) {
            if (index < dataPoints.length) {
                dataPoints[index].metadata = mdata;
            }
        };

        this.insertPixel = function(index, pxi, pyi, mdata) {
            dataPoints.splice(index, 0, {x: pxi, y: pyi, metadata: mdata});
        };

        this.removePixelAtIndex = function(index) {
            if(index < dataPoints.length) {
                dataPoints.splice(index, 1);
            }
        };

        this.removeLastPixel = function() {
            var pIndex = dataPoints.length - 1;
            this.removePixelAtIndex(pIndex);
        };

        this.findNearestPixel = function(x, y, threshold) {
            threshold = (threshold == null) ? 50 : parseFloat(threshold);
            var minDist, minIndex = -1, 
                i, dist;
            for(i = 0; i < dataPoints.length; i++) {
                dist = Math.sqrt((x - dataPoints[i].x)*(x - dataPoints[i].x) + (y - dataPoints[i].y)*(y - dataPoints[i].y));
                if((minIndex < 0 && dist <= threshold) || (minIndex >= 0 && dist < minDist)) {
                    minIndex = i;
                    minDist = dist;
                }
            }
            return minIndex;
        };

        this.removeNearestPixel = function(x, y, threshold) {
            var minIndex = this.findNearestPixel(x, y, threshold);
            if(minIndex >= 0) {
                this.removePixelAtIndex(minIndex);
            }
        };

        this.clearAll = function() { 
            dataPoints = []; 
            hasMetadata = false; 
            mkeys = []; 
        };

        this.getCount = function() { return dataPoints.length; };
 
        this.selectPixel = function(index) {
            if(selections.indexOf(index) >= 0) {
                return;
            }
            selections[selections.length] = index;
        };

        this.unselectAll = function () {
            selections = [];
        };

        this.selectNearestPixel = function(x, y, threshold) {
            var minIndex = this.findNearestPixel(x, y, threshold);
            if(minIndex >= 0) {
                this.selectPixel(minIndex);
            }
            return minIndex;
        };

        this.selectNextPixel = function() {
            for(var i = 0; i < selections.length; i++) {
                selections[i] = (selections[i] + 1) % dataPoints.length;
            }
        };

        this.selectPreviousPixel = function() {
            var i, newIndex;
            for(i = 0; i < selections.length; i++) {
                newIndex = selections[i];
                if(newIndex === 0) {
                    newIndex = dataPoints.length - 1;
                } else {
                    newIndex = newIndex - 1;
                }
                selections[i] = newIndex;
            }
        };

        this.getSelectedPixels = function () {
            return selections;
        };

    };
})();


/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

/* Parse dates and convert back and forth to Julian days */
var wpd = wpd || {};

wpd.dateConverter = (function () {

    function parse(input) {
        if(input == null) { return null; }

        if(typeof input === "string") {
            if(input.indexOf('/') < 0) { return null; }
        }

        return toJD(input);
    }

    function toJD(dateString) {
        dateString = dateString.toString();
	    var dateParts = dateString.split("/"),
			year,
			month,
			day,
			tempDate,
			rtnValue;

        if(dateParts.length <= 0 || dateParts.length > 3) {
            return null;
        }

        year = parseInt(dateParts[0], 10);

        month = parseInt(dateParts[1] === undefined ? 0 : dateParts[1], 10);

        date = parseInt(dateParts[2] === undefined ? 1 : dateParts[2], 10);

        if(isNaN(year) || isNaN(month) || isNaN(date)) {
            return null;
        }

        if(month > 12 || month < 1) {
            return null;
        }

        if(date > 31 || date < 1) {
            return null;
        }

        // Temporary till I figure out julian dates:
        tempDate = new Date();
        tempDate.setUTCFullYear(year);
        tempDate.setUTCMonth(month-1);
        tempDate.setUTCDate(date);
        rtnValue = parseFloat(Date.parse(tempDate));
        if(!isNaN(rtnValue)) {
            return rtnValue;
        }
        return null;
    }

    function fromJD(jd) {
        // Temporary till I figure out julian dates:
        jd = parseFloat(jd);
        var msInDay = 24*60*60*1000,
            roundedDate = parseInt(Math.round(jd/msInDay)*msInDay,10),
            tempDate = new Date(roundedDate);

        return tempDate;
    }
    
    function formatDateNumber(dateNumber, formatString) {
        return formatDate(fromJD(dateNumber), formatString);
    }

    function formatDate(dateObject, formatString) {
        var longMonths = [
                            "January", 
                            "February", 
                            "March", 
                            "April", 
                            "May", 
                            "June", 
                            "July", 
                            "August", 
                            "September",
                            "October",
                            "November",
                            "December"
                        ],
            shortMonths = [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec"
                        ];
        
        var outputString = formatString;

        outputString = outputString.replace("YYYY", "yyyy");
        outputString = outputString.replace("YY", "yy");
        outputString = outputString.replace("MMMM", "mmmm");
        outputString = outputString.replace("MMM", "mmm");
        outputString = outputString.replace("MM", "mm");
        outputString = outputString.replace("DD", "dd");

        outputString = outputString.replace("yyyy", dateObject.getUTCFullYear());

        var twoDigitYear = dateObject.getUTCFullYear()%100;
        twoDigitYear = twoDigitYear < 10 ? '0' + twoDigitYear : twoDigitYear;

        outputString = outputString.replace("yy", twoDigitYear);

        outputString = outputString.replace("mmmm", longMonths[dateObject.getUTCMonth()]);
        outputString = outputString.replace("mmm", shortMonths[dateObject.getUTCMonth()]);
        outputString = outputString.replace("mm", (dateObject.getUTCMonth()+1));
        outputString = outputString.replace("dd", dateObject.getUTCDate());
				
		return outputString;
    }

    function getFormatString(dateString) {
    	var dateParts = dateString.split("/"),
            year,
            month,
            date,
            formatString = 'yyyy/mm/dd';
        
        if(dateParts.length >= 1) {
            formatString = 'yyyy';
        }

        if(dateParts.length >= 2) {
            formatString += '/mm';
        }

        if(dateParts.length === 3) {
            formatString += '/dd';
        }

        return formatString;
    }

    return {
        parse: parse,
        getFormatString: getFormatString,
        formatDate: formatDate,
        formatDateNumber: formatDateNumber
    };
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.gridDetectionCore = (function () {

    var hasHorizontal, hasVertical, xFrac = 0.1, yFrac = 0.1;

    function run() {
        var gridData = [],
            xi,
            yi,
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            xmin = autoDetector.gridMask.xmin,
            xmax = autoDetector.gridMask.xmax,
            ymin = autoDetector.gridMask.ymin,
            ymax = autoDetector.gridMask.ymax,
            dw = autoDetector.imageWidth,
            dh = autoDetector.imageHeight,
            linePixCount;
        
        if (hasVertical) {

            for(xi = xmin; xi <= xmax; xi++) {
                linePixCount = 0;
                for(yi = ymin; yi < ymax; yi++) {
                    if(autoDetector.gridBinaryData[yi*dw + xi] === true) {
                        linePixCount++;
                    }
                }
                if(linePixCount > yFrac*(ymax-ymin)) {
                    for(yi = ymin; yi < ymax; yi++) {
                        gridData[yi*dw + xi] = true;
                    }
                }
            }
        }

        if (hasHorizontal) {

            for(yi = ymin; yi <= ymax; yi++) {
                linePixCount = 0;
                for(xi = xmin; xi <= xmax; xi++) {
                    if(autoDetector.gridBinaryData[yi*dw + xi] === true) {
                        linePixCount++;
                    }
                }
                if(linePixCount > xFrac*(xmax-xmin)) {
                    for(xi = xmin; xi <= xmax; xi++) {
                        gridData[yi*dw + xi] = true;
                    }
                }
            }
             
        }

        wpd.appData.getPlotData().gridData = gridData;
    }

    function setHorizontalParameters(has_horizontal, y_perc) {
        hasHorizontal = has_horizontal;
        yFrac = Math.abs(parseFloat(y_perc)/100.0);
    }

    function setVerticalParameters(has_vertical, x_perc) {
        hasVertical = has_vertical;
        xFrac = Math.abs(parseFloat(x_perc)/100.0);
    }

    return {
        run: run,
        setHorizontalParameters: setHorizontalParameters,
        setVerticalParameters: setVerticalParameters
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

/* Parse user provided expressions, dates etc. */
var wpd = wpd || {};

wpd.InputParser = (function () {
    var Parser = function () {
        this.parse = function (input) {
            this.isValid = false;
            this.isDate = false;
            this.formatting = null;

            if(input == null) {
                return null;
            }

            if(typeof input === "string") {
                input = input.trim();

                if(input.indexOf('^') >= 0) {
                    return null;
                }
            }

            var parsedDate = wpd.dateConverter.parse(input);
            if(parsedDate != null) {
                this.isValid = true;
                this.isDate = true;
                this.formatting = wpd.dateConverter.getFormatString(input);
                return parsedDate;
            }

            var parsedFloat = parseFloat(input);
            if(!isNaN(parsedFloat)) {
                this.isValid = true;
                return parsedFloat;
            }

            return null;
        };

        this.isValid = false;

        this.isDate = false;

        this.formatting = null;
    };
    return Parser;
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/


/** 
 * Calculate inverse tan with range between 0, 2*pi.
 */
var wpd = wpd || {};

wpd.taninverse = function(y,x) {
    var inv_ans;
    if (y>0) // I & II
    inv_ans = Math.atan2(y,x);
    else if (y<=0) // III & IV
    inv_ans = Math.atan2(y,x) + 2*Math.PI;

    if(inv_ans >= 2*Math.PI)
    inv_ans = 0.0;
    return inv_ans;
};

wpd.sqDist2d = function (x1, y1, x2, y2) {
    return (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
};

wpd.sqDist3d = function (x1, y1, z1, x2, y2, z2) {
    return (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2) + (z1 - z2)*(z1 - z2);
};

wpd.dist2d = function (x1, y1, x2, y2) {
    return Math.sqrt(wpd.sqDist2d(x1, y1, x2, y2));
};

wpd.dist3d = function (x1, y1, z1, x2, y2, z2) {
    return Math.sqrt(wpd.sqDist3d(x1, y1, z1, x2, y2, z2));
};

wpd.mat = (function () {
    
    function det2x2(m) {
        return m[0]*m[3] - m[1]*m[2];
    }

    function inv2x2(m) {
        var det = det2x2(m);
        return [m[3]/det, -m[1]/det, -m[2]/det, m[0]/det];
    }

    function mult2x2(m1, m2) {
        return [
                    m1[0]*m2[0] + m1[1]*m2[2], 
                    m1[0]*m2[1] + m1[1]*m2[3], 
                    m1[2]*m2[0] + m1[3]*m2[2], 
                    m1[2]*m2[1] + m1[3]*m2[3]
               ];
    }

    function mult2x2Vec(m, v) {
        return [m[0]*v[0] + m[1]*v[1], m[2]*v[0] + m[3]*v[1]];
    }

    function multVec2x2(v, m) {
        return [m[0]*v[0] + m[2]*v[1], m[1]*v[0] + m[3]*v[1]];
    }

    return {
        det2x2: det2x2,
        inv2x2: inv2x2,
        mult2x2: mult2x2,
        mult2x2Vec: mult2x2Vec,
        multVec2x2: multVec2x2
    };
})();

wpd.cspline = function(x, y) {
    var len = x.length,
        cs = {
            x: x,
            y: y,
            len: len,
            d: []
        },
        l = [],
        b = [],
        i;

    /* TODO: when len = 1, return the same value. For len = 2, do a linear interpolation */
    if(len < 3) {
        return null;
    }

    b[0] = 2.0;
    l[0] = 3.0*(y[1] - y[0]);
    for(i = 1; i < len-1; ++i) {
        b[i] = 4.0 - 1.0/b[i-1];
        l[i] = 3.0*(y[i+1] - y[i-1]) - l[i-1]/b[i-1];
    }

    b[len-1] = 2.0 - 1.0/b[len-2];
    l[len-1] = 3.0*(y[len-1] - y[len-2]) - l[len-2]/b[len-1];

    i = len-1;
    cs.d[i] = l[i]/b[i];
    while(i > 0) {
        --i;
        cs.d[i] = (l[i] - cs.d[i+1])/b[i];
    }

    return cs;
}

wpd.cspline_interp = function(cs, x) {
    var i = 0, t, a, b, c, d;
    if ( x >= cs.x[cs.len-1] || x < cs.x[0] ) {
        return null;
    }

    /* linear search to find the index */
    while(x > cs.x[i]) { i++; }

    i = (i > 0) ? i - 1: 0;
    t = (x - cs.x[i])/(cs.x[i+1] - cs.x[i]);
    a = cs.y[i];
    b = cs.d[i];
    c = 3.0*(cs.y[i+1] - cs.y[i]) - 2.0*cs.d[i] - cs.d[i+1];
    d = 2.0*(cs.y[i] - cs.y[i+1]) + cs.d[i] + cs.d[i+1];
    return a + b*t + c*t*t + d*t*t*t;
}

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// Plot information
wpd.PlotData = (function () {
    var PlotData = function() {

        var activeSeriesIndex = 0,
            autoDetector = new wpd.AutoDetector();
        
        this.topColors = null;
        this.axes = null;
        this.dataSeriesColl = [];
        this.gridData = null;
        this.calibration = null;

        this.angleMeasurementData = null;
        this.distanceMeasurementData = null;
        this.openPathMeasurementData = null;
        this.closedPathMeasurementData = null;
        this.backupImageData = null;

        this.getActiveDataSeries = function() {
            if (this.dataSeriesColl[activeSeriesIndex] == null) {
                this.dataSeriesColl[activeSeriesIndex] = new wpd.DataSeries();
            }
            return this.dataSeriesColl[activeSeriesIndex];
        };

        this.getDataSeriesCount = function() {
            return this.dataSeriesColl.length;
        };

        this.setActiveDataSeriesIndex = function(index) {
            activeSeriesIndex = index;
        };

        this.getActiveDataSeriesIndex = function() {
            return activeSeriesIndex;
        };

        this.getAutoDetector = function() {
            return autoDetector;
        };

        this.getDataSeriesNames = function() {
            var rtnVal = [];
            for(var i = 0; i < this.dataSeriesColl.length; i++) {
                rtnVal[i] = this.dataSeriesColl[i].name;
            }
            return rtnVal;
        };

        this.reset = function() {
            this.axes = null;
            this.angleMeasurementData = null;
            this.distanceMeasurementData = null;
            this.openPathMeasurementData = null;
            this.closedPathMeasurementData = null;
            this.dataSeriesColl = [];
            this.gridData = null;
            this.calibration = null;
            this.backupImageData = null;
            activeSeriesIndex = 0;
            autoDetector = new wpd.AutoDetector();
        };
    };

    return PlotData;
})();


/*
    WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

    Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

    This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/


var wpd = wpd || {};

wpd.AveragingWindowAlgo = (function () {

    var Algo = function () {

        var xStep = 5, yStep = 5;

        this.getParamList = function () {
            return [['ΔX', 'Px', 10], ['ΔY', 'Px', 10]];
        };

        this.setParam = function (index, val) {
            if(index === 0) {
                xStep = val;
            } else if(index === 1) {
                yStep = val;
            }
        };

        this.run = function (plotData) {
            var autoDetector = plotData.getAutoDetector(),
                dataSeries = plotData.getActiveDataSeries(),
                algoCore = new wpd.AveragingWindowCore(autoDetector.binaryData, autoDetector.imageHeight, autoDetector.imageWidth, xStep, yStep, dataSeries);

            algoCore.run();
        };

    };
    return Algo;
})();

/*
    WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

    Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

    This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.AveragingWindowCore = (function () {
    var Algo = function (binaryData, imageHeight, imageWidth, dx, dy, dataSeries) {
        this.run = function () {
            var xPoints = [],
                xPointsPicked = 0,
                pointsPicked = 0,
                dw = imageWidth,
                dh = imageHeight,
                blobAvg = [],
                coli, rowi,
                firstbloby,
                bi, blobs, blbi, xi, yi,
                pi, inRange, xxi, oldX, oldY, avgX, avgY, newX, newY,
                matches,
                xStep = dx,
                yStep = dy;

            dataSeries.clearAll();

            for (coli = 0; coli < dw; coli++) {

                blobs = -1;
                firstbloby = -2.0*yStep;
                bi = 0;

                // Scan vertically for blobs:

                for (rowi = 0; rowi < dh; rowi++) {
                    if(binaryData[rowi*dw + coli] === true) {
                        if (rowi > firstbloby + yStep) {
                            blobs = blobs + 1;
                            bi = 1;
                            blobAvg[blobs] = rowi;
                            firstbloby = rowi;
                        } else {
                            bi = bi + 1;
                            blobAvg[blobs] = parseFloat((blobAvg[blobs]*(bi-1.0) + rowi)/parseFloat(bi));
                        }
                    }
                }

                if (blobs >= 0) {
                    xi = coli + 0.5;
                    for (blbi = 0; blbi <= blobs; blbi++) {
                      yi = blobAvg[blbi] + 0.5; // add 0.5 to shift to the middle of the pixels instead of the starting edge.

                      xPoints[xPointsPicked] = [];
                      xPoints[xPointsPicked][0] = parseFloat(xi);
                      xPoints[xPointsPicked][1] = parseFloat(yi);
                      xPoints[xPointsPicked][2] = true; // true if not filtered, false if processed already
                      xPointsPicked = xPointsPicked + 1;
                    }
                }

              }

              if (xPointsPicked === 0) {
                    return;
              }

              for(pi = 0; pi < xPointsPicked; pi++) {
                if(xPoints[pi][2] === true) {// if still available
                  inRange = true;
                  xxi = pi+1;

                  oldX = xPoints[pi][0];
                  oldY = xPoints[pi][1];

                  avgX = oldX;
                  avgY = oldY;

                  matches = 1;

                  while((inRange === true) && (xxi < xPointsPicked)) {
                    newX = xPoints[xxi][0];
                    newY = xPoints[xxi][1];

                    if( (Math.abs(newX-oldX) <= xStep) && (Math.abs(newY-oldY) <= yStep) && (xPoints[xxi][2] === true)) {
                        avgX = (avgX*matches + newX)/(matches+1.0);
                        avgY = (avgY*matches + newY)/(matches+1.0);
                        matches = matches + 1;
                        xPoints[xxi][2] = false;
                    }

                    if (newX > oldX + 2*xStep) {
                        inRange = false;
                    }

                    xxi = xxi + 1;
                  }

                  xPoints[pi][2] = false;

                  pointsPicked = pointsPicked + 1;
                  dataSeries.addPixel(parseFloat(avgX), parseFloat(avgY));

                }

              }

              xPoints = [];

              return dataSeries;
        };
    };
    return Algo;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/
var wpd = wpd || {};

wpd.AveragingWindowWithStepSizeAlgo = (function () {
    var Algo = function () {

        var param_xmin, param_delx, param_xmax,
            param_linewidth, param_ymin, param_ymax;

        this.getParamList = function () {
            var isAligned = wpd.appData.isAligned(),
                axes = wpd.appData.getPlotData().axes;

            if(isAligned && axes instanceof wpd.XYAxes) {
                var bounds = axes.getBounds();
                return [["X_min","Units", bounds.x1],["ΔX Step","Units", 0.1],["X_max","Units", bounds.x2],["Y_min","Units", bounds.y3],["Y_max","Units", bounds.y4],["Line width","Px",30]];

            } 

            return [["X_min","Units", 0],["ΔX Step","Units", 0.1],["X_max","Units", 0],["Y_min","Units", 0],["Y_max","Units", 0],["Line width","Px",30]];
        };

        this.setParam = function (index, val) {
            if (index === 0) {
                param_xmin = val;
            } else if (index === 1) {
                param_delx = val;
            } else if (index === 2) {
                param_xmax = val;
            } else if (index === 3) {
                param_ymin = val;
            } else if (index === 4) {
                param_ymax = val;
            } else if (index === 5) {
                param_linewidth = val;
            }
        };

        this.run = function (plotData) {
            var autoDetector = plotData.getAutoDetector(),
                dataSeries = plotData.getActiveDataSeries(),
                axes = plotData.axes,
                pointsPicked = 0,
                dw = autoDetector.imageWidth,
                dh = autoDetector.imageHeight,
                blobx = [],
                bloby = [],
                xi, xmin_pix, xmax_pix, ymin_pix, ymax_pix, dpix, r_unit_per_pix, step_pix,
                blobActive, blobEntry, blobExit,
                blobExitLocked,
                ii, yi,
                mean_ii,
                mean_yi,
                pdata;

            dataSeries.clearAll();

            for (xi = param_xmin; xi <= param_xmax; xi+= param_delx) {
                step_pix = 1;

                pdata = axes.dataToPixel(xi, param_ymin);
                xmin_pix = pdata.x;
                ymin_pix = pdata.y;

                pdata = axes.dataToPixel(xi, param_ymax);
                xmax_pix = pdata.x;
                ymax_pix = pdata.y;

                dpix = Math.sqrt((ymax_pix-ymin_pix)*(ymax_pix-ymin_pix) + (xmax_pix-xmin_pix)*(xmax_pix-xmin_pix));
                r_unit_per_pix = (param_ymax-param_ymin)/dpix;

                blobActive = false;
                blobEntry = 0;
                blobExit = 0;
                // To account for noise or if actual thickness is less than specified thickness.
				// This flag helps to set blobExit at the end of the thin part or account for noise.
				blobExitLocked = false;

                for (ii = 0; ii <= dpix; ii++) {
                    yi = -ii*step_pix*r_unit_per_pix + param_ymax;
                    pdata = axes.dataToPixel(xi, yi);
                    xi_pix = pdata.x;
                    yi_pix = pdata.y;

                    if(xi_pix >= 0 && xi_pix < dw && yi_pix >=0 && yi_pix < dh)	{
                        if (autoDetector.binaryData[parseInt(yi_pix, 10)*dw + parseInt(xi_pix, 10)] === true) {
                            if(blobActive === false) {
								blobEntry = ii;
								blobExit = blobEntry;
								blobActive = true;
								blobExitLocked = false;
							}
                            // Resume collection, it was just noise
							if(blobExitLocked === true) {
								blobExit = ii;
								blobExitLocked = false;
							}
                        } else	{

							// collection ended before line thickness was hit. It could just be noise
							// or it could be the actual end.
							if(blobExitLocked === false) {
								blobExit = ii;
								blobExitLocked = true;
							}					
						}

                        if(blobActive === true)	{

							if((ii > blobEntry + param_linewidth) || (ii == dpix-1)) {
								blobActive = false;

								if(blobEntry > blobExit) {
									blobExit = ii;							
								}

								mean_ii = (blobEntry + blobExit)/2.0;
								mean_yi = -mean_ii*step_pix*r_unit_per_pix + param_ymax;

								pdata = axes.dataToPixel(xi, mean_yi);
								dataSeries.addPixel(parseFloat(pdata.x), parseFloat(pdata.y));
								pointsPicked = pointsPicked + 1;
							}
						}
                    }
                }
            }

        };

    };
    return Algo;
})();

/*
    WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

    Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

    This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.BarValue = function () {
    this.npoints = 0;

    this.avgValTop = 0;

    this.avgValBot = 0;

    this.avgX = 0;

    this.append = function(x, valTop, valBot) {
        this.avgX = (this.npoints*this.avgX + x)/(this.npoints + 1.0);
        this.avgValTop = (this.npoints*this.avgValTop + valTop)/(this.npoints + 1.0);
        this.avgValBot = (this.npoints*this.avgValBot + valBot)/(this.npoints + 1.0);
        this.npoints++;
    };

    this.isPointInGroup = function(x, valTop, valBot, del_x, del_val) {
        if(this.npoints === 0) {
            return true;
        }

        if(Math.abs(this.avgX - x) <= del_x && Math.abs(this.avgValTop - valTop) <= del_val && Math.abs(this.avgValBot - valBot) <= del_val) {
            return true;
        }

        return false;
    };
};


wpd.BarExtractionAlgo = function() {

    var delX, delVal;
    
    this.getParamList = function() {
        var axes = wpd.appData.getPlotData().axes,
            orientationAxes = axes.getOrientation().axes;

        if(orientationAxes === 'Y') {
            return [['ΔX', 'Px', 30], ['ΔVal', 'Px', 10]];
        } else {
            return [['ΔY', 'Px', 30], ['ΔVal', 'Px', 10]];
        }
    };

    this.setParam = function (index, val) {
        if (index === 0) {
            delX = parseFloat(val);
        } else if (index === 1) {
            delVal = parseFloat(val);
        }
    };

    this.run = function(plotData) {
        var autoDetector = plotData.getAutoDetector(),
            dataSeries = plotData.getActiveDataSeries(),
            orientation = plotData.axes.getOrientation(),                
            barValueColl = [],
            valTop, valBot, valCount, val,
            px, py,
            width = autoDetector.imageWidth,
            height = autoDetector.imageHeight,
            pixelAdded,
            barValuei,
            bv,
            dataVal,
            pxVal,
            mkeys,
            topVal,
            botVal,
            
            appendData = function (x, valTop, valBot) {                
                pixelAdded = false;
                for(barValuei = 0; barValuei < barValueColl.length; barValuei++) {
                    bv = barValueColl[barValuei];

                    if(bv.isPointInGroup(x, valTop, valBot, delX, delVal)) {
                        bv.append(x, valTop, valBot);
                        pixelAdded = true;
                        break;
                    }
                }
                if(!pixelAdded) {
                    bv = new wpd.BarValue();
                    bv.append(x, valTop, valBot);
                    barValueColl.push(bv);
                }
            };

        dataSeries.clearAll();

        // Switch directions based on axes orientation and direction of data along that axes:
        // For each direction, look for both top and bottom side of the bar to account for cases where some bars are oriented
        // in the increasing direction, while others are in a decreasing direction
        if(orientation.axes === 'Y') {
            for (px = 0; px < width; px++) {                
                valTop = 0;
                valBot = height - 1;
                valCount = 0;

                for(py = 0; py < height; py++) {
                    if(autoDetector.binaryData[py*width + px]) {
                        valTop = py;
                        valCount++;
                        break;
                    }
                }
                for(py = height-1; py >= 0; py--) {
                    if(autoDetector.binaryData[py*width + px]) {
                        valBot = py;
                        valCount++;
                        break;
                    }
                }
                if(valCount === 2) { // found both top and bottom ends
                    appendData(px, valTop, valBot);
                }
            }
        } else {
            for (py = 0; py < height; py++) {
                valTop = width - 1;
                valBot = 0;
                valCount = 0;

                for(px = width-1; px >= 0; px--) {
                    if(autoDetector.binaryData[py*width + px]) {
                        valTop = px;
                        valCount++;
                        break;
                    }
                }
                for(px = 0; px < width; px++) {
                    if(autoDetector.binaryData[py*width + px]) {
                        valBot = px;
                        valCount++;
                        break;
                    }
                }
                if(valCount === 2) {
                    appendData(py, valTop, valBot);
                }
            }
        }
        
        if(plotData.axes.dataPointsHaveLabels) {
            mkeys = dataSeries.getMetadataKeys();
            if(mkeys == null || mkeys[0] !== 'Label') {
                dataSeries.setMetadataKeys(['Label']);
            }
        }

        for(barValuei = 0; barValuei < barValueColl.length; barValuei++) {
            
            bv = barValueColl[barValuei];
            
            if(orientation.axes === 'Y') {
                valTop = plotData.axes.pixelToData(bv.avgX, bv.avgValTop)[0];
                valBot = plotData.axes.pixelToData(bv.avgX, bv.avgValBot)[0];
            } else {
                valTop = plotData.axes.pixelToData(bv.avgValTop, bv.avgX)[0];
                valBot = plotData.axes.pixelToData(bv.avgValBot, bv.avgX)[0];
            }
                
            if(valTop + valBot < 0) {
                val = orientation.direction === 'increasing' ? bv.avgValBot : bv.avgValTop;
            } else {
                val = orientation.direction === 'increasing' ? bv.avgValTop : bv.avgValBot;
            }

            if(plotData.axes.dataPointsHaveLabels) {
               
                if(orientation.axes === 'Y') {
                    dataSeries.addPixel(bv.avgX + 0.5, val + 0.5, ["Bar" + barValuei]);
                } else {
                    dataSeries.addPixel(val + 0.5, bv.avgX + 0.5, ["Bar" + barValuei]);
                }

            } else {

                if(orientation.axes === 'Y') {
                    dataSeries.addPixel(bv.avgX + 0.5, val + 0.5);
                } else {
                    dataSeries.addPixel(val + 0.5, bv.avgX + 0.5);
                }

            }            
        }
    };
};
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/
wpd = wpd || {};

wpd.BlobDetectorAlgo = (function () {

    var Algo = function () {
        var min_dia, max_dia;

        this.getParamList = function () {
            var isAligned = wpd.appData.isAligned(),
                axes = wpd.appData.getPlotData().axes;

            if (isAligned && axes instanceof wpd.MapAxes) {
			    return [['Min Diameter', 'Units', 0], ['Max Diameter', 'Units', 5000]];
            }

			return [['Min Diameter', 'Px', 0], ['Max Diameter', 'Px', 5000]];
        };

        this.setParam = function (index, val) {
            if (index === 0) {
                min_dia = parseFloat(val);
            } else if (index === 1) {
                max_dia = parseFloat(val);
            }
        };

        this.run = function (plotData) {
            var autoDetector = plotData.getAutoDetector(),
                dataSeries = plotData.getActiveDataSeries(),
                dw = autoDetector.imageWidth,
                dh = autoDetector.imageHeight,
                pixelVisited = [],
                blobCount = 0,
                blobs = [],
                xi, yi,
                blobPtIndex,
                bIndex,
                nxi, nyi,
                bxi, byi,
                pcount,
                dia;

            if (dw <= 0 || dh <= 0 || autoDetector.binaryData == null
                || autoDetector.binaryData.length === 0) {
                return;
            }

            dataSeries.clearAll();
            dataSeries.setMetadataKeys(["area", "moment"]);

            for (xi = 0; xi < dw; xi++) {
                for (yi = 0; yi < dh; yi++) {
                    if (autoDetector.binaryData[yi*dw + xi] === true && !(pixelVisited[yi*dw + xi] === true)) {

                        pixelVisited[yi*dw + xi] = true;

                        bIndex = blobs.length;

                        blobs[bIndex] = {
                            pixels: [{x: xi, y: yi}],
                            centroid: {x: xi, y: yi},
                            area: 1.0,
                            moment: 0.0
                        };

                        blobPtIndex = 0;
                        while (blobPtIndex < blobs[bIndex].pixels.length) {
                            bxi = blobs[bIndex].pixels[blobPtIndex].x;
                            byi = blobs[bIndex].pixels[blobPtIndex].y;

                            for (nxi = bxi - 1; nxi <= bxi + 1; nxi++) {
                                for(nyi = byi - 1; nyi <= byi + 1; nyi++) {
                                    if (nxi >= 0 && nyi >= 0 && nxi < dw && nyi < dh) {
                                        if (!(pixelVisited[nyi*dw + nxi] === true) && autoDetector.binaryData[nyi*dw + nxi] === true) {

                                            pixelVisited[nyi*dw + nxi] = true;

                                            pcount = blobs[bIndex].pixels.length;

                                            blobs[bIndex].pixels[pcount] = {
                                                x: nxi,
                                                y: nyi
                                            };

                                            blobs[bIndex].centroid.x = (blobs[bIndex].centroid.x*pcount + nxi)/(pcount + 1.0);
                                            blobs[bIndex].centroid.y = (blobs[bIndex].centroid.y*pcount + nyi)/(pcount + 1.0);
                                            blobs[bIndex].area = blobs[bIndex].area + 1.0;
                                        }
                                    }
                                }
                            }
                            blobPtIndex = blobPtIndex + 1;
                        }
                    }
                }
            }

            for (bIndex = 0; bIndex < blobs.length; bIndex++) {
                blobs[bIndex].moment = 0;
                for (blobPtIndex = 0; blobPtIndex < blobs[bIndex].pixels.length; blobPtIndex++) {
                    blobs[bIndex].moment = blobs[bIndex].moment
                        + (blobs[bIndex].pixels[blobPtIndex].x - blobs[bIndex].centroid.x)*(blobs[bIndex].pixels[blobPtIndex].x - blobs[bIndex].centroid.x)
                        + (blobs[bIndex].pixels[blobPtIndex].y - blobs[bIndex].centroid.y)*(blobs[bIndex].pixels[blobPtIndex].y - blobs[bIndex].centroid.y);

                }
                if (plotData.axes instanceof wpd.MapAxes) {
                    blobs[bIndex].area = plotData.axes.pixelToDataArea(blobs[bIndex].area);
                }

                dia = 2.0*Math.sqrt(blobs[bIndex].area/Math.PI);
                if (dia <= max_dia && dia >= min_dia) {
                    // add 0.5 pixel offset to shift to the center of the pixels.
                    dataSeries.addPixel(blobs[bIndex].centroid.x + 0.5, blobs[bIndex].centroid.y + 0.5, [blobs[bIndex].area, blobs[bIndex].moment]);
                }
            }
        };
    };

    return Algo;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.XStepWithInterpolationAlgo = (function () {
    var Algo = function () {
        var param_xmin, param_delx, param_xmax, 
            param_smoothing, param_ymin, param_ymax;

        this.getParamList = function () {
            var isAligned = wpd.appData.isAligned(),
                axes = wpd.appData.getPlotData().axes;
        
            if(isAligned && axes instanceof wpd.XYAxes) {
                var bounds = axes.getBounds();
                return [["X_min","Units", bounds.x1],["ΔX Step","Units", (bounds.x2 - bounds.x1)/50.0], 
                        ["X_max","Units", bounds.x2],["Y_min","Units", bounds.y3],
                        ["Y_max","Units", bounds.y4],["Smoothing","% of ΔX", 0]];

            } 

            return [["X_min","Units", 0],["ΔX Step","Units", 0.1],
                    ["X_max","Units", 0],["Y_min","Units", 0],
                    ["Y_max","Units", 0],["Smoothing","% of ΔX", 0]];
        };
        
        this.setParam = function (index, val) {
            if (index === 0) {
                param_xmin = val;
            } else if (index === 1) {
                param_delx = val;
            } else if (index === 2) {
                param_xmax = val;
            } else if (index === 3) {
                param_ymin = val;
            } else if (index === 4) {
                param_ymax = val;
            } else if (index === 5) {
                param_smoothing = val;
            }
        };

        this.run = function (plotData) {
            var autoDetector = plotData.getAutoDetector(),
                dataSeries = plotData.getActiveDataSeries(),
                axes = plotData.axes,
                pointsPicked = 0,
                dw = autoDetector.imageWidth,
                dh = autoDetector.imageHeight,
                xi,
                dist_y_px,
                dist_x_px,
                ii, yi, jj, 
                mean_yi,
                y_count,
                pdata,
                pdata0,
                pdata1,
                xpoints = [],
                ypoints = [],
                xpoints_mean = [],
                ypoints_mean = [],
                mean_x, mean_y,
                delx,
                dely,
                xinterp,
                yinterp,
                param_width = Math.abs(param_delx*(param_smoothing/100.0)),
                cs;

            dataSeries.clearAll();

            // Calculate pixel distance between y_min and y_max:
            pdata0 = axes.dataToPixel(param_xmin, param_ymin);
            pdata1 = axes.dataToPixel(param_xmin, param_ymax);
            dist_y_px = Math.sqrt((pdata0.x - pdata1.x)*(pdata0.x - pdata1.x) + (pdata0.y - pdata1.y)*(pdata0.y - pdata1.y));
            dely = (param_ymax - param_ymin)/dist_y_px;

            // Calculate pixel distance between x_min and x_max:
            pdata1 = axes.dataToPixel(param_xmax, param_ymin);
            dist_x_px = Math.sqrt((pdata0.x - pdata1.x)*(pdata0.x - pdata1.x) + (pdata0.y - pdata1.y)*(pdata0.y - pdata1.y));
            delx = (param_xmax - param_xmin)/dist_x_px;

            if(Math.abs(param_width/delx) > 0 && Math.abs(param_width/delx) < 1) {
                param_width = delx;
            }

            xi = param_xmin;
            while( ( delx > 0 && xi <= param_xmax ) || ( delx < 0 && xi >= param_xmax ) ) {

                mean_yi = 0; y_count = 0;
                yi = param_ymin;
                while ( ( dely > 0 && yi <= param_ymax ) || ( dely < 0 && yi >= param_ymax ) ) {
                    pdata = axes.dataToPixel(xi, yi);
                    if (pdata.x > 0 && pdata.y > 0 && pdata.x < dw && pdata.y < dh) {
                        if (autoDetector.binaryData[parseInt(pdata.y, 10)*dw + parseInt(pdata.x, 10)] === true) {
                            mean_yi = (mean_yi*y_count + yi)/(parseFloat(y_count+1));
                            y_count++;
                        }
                    }
                    yi = yi + dely;
                }

                if (y_count > 0) {
                    xpoints[pointsPicked] = parseFloat(xi);
                    ypoints[pointsPicked] = parseFloat(mean_yi);
                    pointsPicked = pointsPicked + 1;
                }

                xi = xi + delx;
            }
            
            if (xpoints.length <= 0 || ypoints.length <= 0) {
                return; // kill if nothing was detected so far.
            }

            if (param_width > 0) {
                xpoints_mean = [];
                ypoints_mean = [];

                xi = xpoints[0];
                while ( (delx > 0 && xi <= xpoints[xpoints.length-1]) || (delx < 0 && xi >= xpoints[xpoints.length-1]) ) {
                    mean_x = 0;
                    mean_y = 0;
                    y_count = 0;
                    for (ii = 0; ii < xpoints.length; ii++) {
                        if (xpoints[ii] <= xi + param_width && xpoints[ii] >= xi - param_width) {
                            mean_x = (mean_x*y_count + xpoints[ii])/parseFloat(y_count + 1);
                            mean_y = (mean_y*y_count + ypoints[ii])/parseFloat(y_count + 1);
                            y_count++;
                        }
                    }

                    if (y_count > 0) {
                        xpoints_mean[xpoints_mean.length] = mean_x;
                        ypoints_mean[ypoints_mean.length] = mean_y;
                    }

                    if(delx > 0) {
                        xi = xi + param_width;
                    } else {
                        xi = xi - param_width;
                    }
                }

            } else {
                xpoints_mean = xpoints;
                ypoints_mean = ypoints;
            }

            if (xpoints_mean.length <= 0 || ypoints_mean.length <= 0) {
                return;
            }

            xinterp = [];
            ii = 0;
            xi = param_xmin;

            if (( delx < 0 && param_delx > 0) || (delx > 0 && param_delx < 0)) {
                return;
            }
            
            while ( (delx > 0 && xi <= param_xmax) || (delx < 0 && xi >= param_xmax) ) {
                xinterp[ii] = xi;
                ii++;
                xi = xi + param_delx;
            }

            if(delx < 0) {
                xpoints_mean = xpoints_mean.reverse();
                ypoints_mean = ypoints_mean.reverse();
            }

            // Cubic spline interpolation:
            cs = wpd.cspline(xpoints_mean, ypoints_mean);
            if(cs != null) {
                yinterp = [];
                for(ii = 0; ii < xinterp.length; ++ii) {
                    if(!isNaN(xinterp[ii])) {
                        yinterp[ii] = wpd.cspline_interp(cs, xinterp[ii]);
                        if(yinterp[ii] !== null) {
                            pdata = axes.dataToPixel(xinterp[ii], yinterp[ii]);
                            dataSeries.addPixel(pdata.x, pdata.y);
                        }
                    }            
                }
            }

         };
            
    };
    return Algo;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.BarAxes = (function () {

    var AxesObj = function () {
        // Throughout this code, it is assumed that "y" is the continuous axes and "x" is
        // the discrete axes. In practice, this shouldn't matter even if the orientation
        // is different.
        var isCalibrated = false,
            isLogScale = false,
            x1, y1, x2, y2, p1, p2,
            orientation;

        this.isCalibrated = function () {
            return isCalibrated;
        };

        this.calibrate = function(calibration, isLog, isRotated) {
            isCalibrated = false;
            var cp1 = calibration.getPoint(0),
                cp2 = calibration.getPoint(1);

            x1 = cp1.px;
            y1 = cp1.py;
            x2 = cp2.px;
            y2 = cp2.py;
            p1 = parseFloat(cp1.dy);
            p2 = parseFloat(cp2.dy);

            if(isLog) {
                isLogScale = true;
                p1 = Math.log(p1)/Math.log(10);
                p2 = Math.log(p2)/Math.log(10);
            } else {
                isLogScale = false;
            }

            orientation = this.calculateOrientation();
            
            if(!isRotated) {
                // ignore rotation and assume axes is precisely vertical or horizontal
                if(orientation.axes == 'Y') {
                    x2 = x1;
                } else {
                    y2 = y1;
                }
                // recalculate orientation:
                orientation = this.calculateOrientation();
            }

            isCalibrated = true;
            return true;
        };

        this.pixelToData = function (pxi, pyi) {
            var data = [],
                c_c2 = ((pyi-y1)*(y2-y1) + (x2-x1)*(pxi-x1))/((y2-y1)*(y2-y1) + (x2-x1)*(x2-x1));
            // We could return X pixel value (or Y, depending on orientation) but that's not very useful.
            // For now, just return the bar value. That's it.
            data[0] = (p2 - p1)*c_c2 + p1;
            if(isLogScale) {
                data[0] = Math.pow(10, data[0]);
            }
            return data;
        };

        this.dataToPixel = function (x, y) {
            // not implemented yet
            return {
                x: 0,
                y: 0
            };
        };

        this.pixelToLiveString = function (pxi, pyi) {
            var dataVal = this.pixelToData(pxi, pyi);
            return dataVal[0].toExponential(4);
        };

        this.isLog = function () {
            return isLogScale;
        };

        this.getTransformationEquations = function () {
            return {
                pixelToData: ['This will be available in a future release.']
            };
        };

        this.dataPointsHaveLabels = true;

        this.dataPointsLabelPrefix = 'Bar';

        this.calculateOrientation = function () { // Used by auto-extract algo to switch orientation.
        
            var orientationAngle = wpd.taninverse(-(y2-y1), x2-x1)*180/Math.PI,
                orientation = {
                    axes: 'Y',
                    direction: 'increasing',
                    angle: orientationAngle
                },
                tol = 30; // degrees.
            
            if(Math.abs(orientationAngle - 90) < tol) {
                orientation.axes = 'Y';
                orientation.direction = 'increasing';
            } else if(Math.abs(orientationAngle - 270) < tol) {
                orientation.axes = 'Y';
                orientation.direction = 'decreasing';
            } else if(Math.abs(orientationAngle - 0) < tol || Math.abs(orientationAngle - 360) < tol) {
                orientation.axes = 'X';
                orientation.direction = 'increasing';
            } else if(Math.abs(orientationAngle - 180) < tol) {
                orientation.axes = 'X';
                orientation.direction = 'decreasing';
            }

            return orientation;

        };

        this.getOrientation = function() {
            return orientation;
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function () {
        return 2;
    };

    AxesObj.prototype.getDimensions = function () {
        return 2;
    };

    AxesObj.prototype.getAxesLabels = function () {
        return ['Label', 'Y'];
    };

    return AxesObj;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.ImageAxes = (function () {
    var AxesObj = function () {

        this.isCalibrated = function() {
            return true;
        };

        this.calibrate = function () {
            return true;
        };

        this.pixelToData = function(pxi, pyi) {
            var data = [pxi, pyi];
            return data;
        };

        this.dataToPixel = function(x, y) {
            return {
                x: x,
                y: y
            };
        };

        this.pixelToLiveString = function (pxi, pyi) {
            var dataVal = this.pixelToData(pxi, pyi);
            return dataVal[0].toFixed(2) + ', ' + dataVal[1].toFixed(2);
        };

        this.getTransformationEquations = function () {
            return {
                pixelToData: ['x_data = x_pixel','y_data = y_pixel'],
                dataToPixel: ['x_pixel = x_data', 'y_pixel = y_data']
            };
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function() {
        return 0;
    };

    AxesObj.prototype.getDimensions = function() {
        return 2;
    };

    AxesObj.prototype.getAxesLabels = function() {
        return ['X', 'Y'];
    };


    return AxesObj;
})();



/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.MapAxes = (function () {
    var AxesObj = function () {
        var isCalibrated = false,
            scaleLength,
            scaleUnits,
            dist,
            processCalibration = function(cal, scale_length, scale_units) {
                var cp0 = cal.getPoint(0),
                    cp1 = cal.getPoint(1);
                dist = Math.sqrt((cp0.px-cp1.px)*(cp0.px-cp1.px) + (cp0.py-cp1.py)*(cp0.py-cp1.py));
                scaleLength = parseFloat(scale_length);
                scaleUnits = scale_units;
                return true;
            };

        this.isCalibrated = function() {
            return isCalibrated;
        };

        this.calibrate = function (calib, scale_length, scale_units) {
            isCalibrated = processCalibration(calib, scale_length, scale_units);
            return isCalibrated;
        };

        this.pixelToData = function(pxi, pyi) {
            var data = [];
            data[0] = pxi*scaleLength/dist;
            data[1] = pyi*scaleLength/dist;
            return data;
        };

        this.pixelToDataDistance = function(distancePx) {
            return distancePx*scaleLength/dist;
        };

        this.pixelToDataArea = function (areaPx) {
            return areaPx*scaleLength*scaleLength/(dist*dist);
        };

        this.dataToPixel = function(a, b, c) {
            return {
                x: 0,
                y: 0
            };
        };

        this.pixelToLiveString = function (pxi, pyi) {
            var dataVal = this.pixelToData(pxi, pyi);
            return dataVal[0].toExponential(4) + ', ' + dataVal[1].toExponential(4);
        };

        this.getScaleLength = function () {
            return scaleLength;
        };

        this.getUnits = function () {
            return scaleUnits;
        };

        this.getTransformationEquations = function () {
            return {
                pixelToData:[
                                'x_data = ' + scaleLength/dist + '*x_pixel',
                                'y_data = ' + scaleLength/dist + '*y_pixel'
                            ],
                dataToPixel:[
                                'x_pixel = ' + dist/scaleLength + '*x_data', 
                                'y_pixel = ' + dist/scaleLength + '*y_data'
                            ]
            };
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function() {
        return 2;
    };

    AxesObj.prototype.getDimensions = function() {
        return 2;
    };

    AxesObj.prototype.getAxesLabels = function() {
        return ['X', 'Y'];
    }; 

    return AxesObj;
})();


/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.PolarAxes = (function () {
    var AxesObj = function () {
        var isCalibrated = false,
            isDegrees = false,
            isClockwise = false,
            isLog = false,

            x0, y0, x1, y1, x2, y2, r1, theta1, r2, theta2,
            dist10, dist20, dist12, phi0, alpha0;

            processCalibration = function(cal, is_degrees, is_clockwise, is_log_r) {  
                var cp0 = cal.getPoint(0),
                    cp1 = cal.getPoint(1),
                    cp2 = cal.getPoint(2);
                x0 = cp0.px;
                y0 = cp0.py;
                x1 = cp1.px;
                y1 = cp1.py;
                x2 = cp2.px;
                y2 = cp2.py;

                r1 = cp1.dx;
                theta1 = cp1.dy;
                
                r2 = cp2.dx;
                theta2 = cp2.dy;

                isDegrees = is_degrees;
                isClockwise = is_clockwise;
                
                if (isDegrees === true) {// if degrees
    		        theta1 = (Math.PI/180.0)*theta1;
        			theta2 = (Math.PI/180.0)*theta2;
		        }
		    	
                if(is_log_r) {
                    isLog = true;
                    r1 = Math.log(r1)/Math.log(10);
                    r2 = Math.log(r2)/Math.log(10);
                }
                		    
		        // Distance between 1 and 0.
		        dist10 = Math.sqrt((x1-x0)*(x1-x0) + (y1-y0)*(y1-y0)); 
		    
		        // Distance between 2 and 0
		        dist20 = Math.sqrt((x2-x0)*(x2-x0) + (y2-y0)*(y2-y0)); 
		    
		        // Radial Distance between 1 and 2.
		        dist12 = dist20 - dist10;
		    
		        phi0 = wpd.taninverse(-(y1-y0),x1-x0);
                
                if(isClockwise) {
                    alpha0 = phi0 + theta1;
                } else {
		            alpha0 = phi0 - theta1;
                }

                return true;
            };

        this.isCalibrated = function() {
            return isCalibrated;
        };

        this.calibrate = function (calib, is_degrees, is_clockwise, is_log_r) {
            isCalibrated = processCalibration(calib, is_degrees, is_clockwise, is_log_r);
            return isCalibrated;
        };

        this.isThetaDegrees = function () {
            return isDegrees;
        };

        this.isThetaClockwise = function () {
            return isClockwise;
        };

        this.pixelToData = function(pxi, pyi) {
            var data = [],
                rp,
                thetap;

            xp = parseFloat(pxi);
            yp = parseFloat(pyi);

            rp = ((r2-r1)/dist12)*(Math.sqrt((xp-x0)*(xp-x0)+(yp-y0)*(yp-y0))-dist10) + r1;
			
            if(isClockwise) {
                thetap = alpha0 - wpd.taninverse(-(yp-y0), xp-x0);
            } else {
                thetap = wpd.taninverse(-(yp-y0),xp-x0) - alpha0;
            }

            if(thetap < 0) {
                thetap = thetap + 2*Math.PI;
            }
			
		    if(isDegrees === true) {
		        thetap = 180.0*thetap/Math.PI;
            }

            if(isLog) {
                rp = Math.pow(10, rp);
            }

            data[0] = rp;
            data[1] = thetap;

            return data;
        };

        this.dataToPixel = function(r, theta) {
            return {
                x: 0,
                y: 0
            };
        };

        this.pixelToLiveString = function (pxi, pyi) {
            var dataVal = this.pixelToData(pxi, pyi);
            return dataVal[0].toExponential(4) + ', ' + dataVal[1].toExponential(4);
        };

        this.getTransformationEquations = function () {
            var rEqn = 'r = (' + (r2 - r1)/dist12 + ')*sqrt((x_pixel - ' + x0 + ')^2 + (y_pixel - ' + y0 + ')^2) + ('
                        + (r1-dist10*(r2-r1)/dist12) + ')',
                thetaEqn;

            if(isClockwise) {
                thetaEqn = alpha0 - 'atan2((' + y0 + ' - y_pixel), (x_pixel - ' + x0 + '))';
            } else {
                thetaEqn = 'atan2((' + y0 + ' - y_pixel), (x_pixel - ' + x0 + ')) - (' + alpha0 + ')';
            }

            if(isDegrees) {
                thetaEqn = 'theta = (180/PI)*(' + thetaEqn + '), theta = theta + 360 if theta < 0';
            } else {
                thetaEqn = 'theta = ' + thetaEqn + ' theta = theta + 2*PI if theta < 0';
            }

            return {
                pixelToData: [rEqn, thetaEqn]
            };
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function() {
        return 3;
    };

    AxesObj.prototype.getDimensions = function() {
        return 2;
    };    
    
    AxesObj.prototype.getAxesLabels = function() {
        return ['r', 'θ'];
    };

    return AxesObj;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.TernaryAxes = (function () {
    var AxesObj = function () {
        var isCalibrated = false,
            
            x0, y0, x1, y1, x2, y2, L,
            phi0, root3, isRange0to100,
            isOrientationNormal,

            processCalibration = function(cal, range100, is_normal) {  
                var cp0 = cal.getPoint(0),
                    cp1 = cal.getPoint(1),
                    cp2 = cal.getPoint(2);

                x0 = cp0.px;
                y0 = cp0.py;
                x1 = cp1.px;
                y1 = cp1.py;
                x2 = cp2.px;
                y2 = cp2.py;

                L = Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1));

                phi0 = wpd.taninverse(-(y1-y0),x1-x0);

                root3 = Math.sqrt(3);

                isRange0to100 = range100;

                isOrientationNormal = is_normal;

                return true;
            };

        this.isCalibrated = function() {
            return isCalibrated;
        };

        this.calibrate = function (calib, range100, is_normal) {
            isCalibrated = processCalibration(calib, range100, is_normal);
            return isCalibrated;
        };

        this.isRange100 = function () {
            return isRange0to100;
        };

        this.isNormalOrientation = function () {
            return isOrientationNormal;
        };

        this.pixelToData = function(pxi, pyi) {
            var data = [],
                rp,
                thetap,
                xx,
                yy,
                ap, bp, cp, bpt;

            xp = parseFloat(pxi);
            yp = parseFloat(pyi);

            rp = Math.sqrt((xp-x0)*(xp-x0)+(yp-y0)*(yp-y0));

            thetap = wpd.taninverse(-(yp-y0),xp-x0) - phi0;

            xx = (rp*Math.cos(thetap))/L;
		    yy = (rp*Math.sin(thetap))/L;
			
			ap = 1.0 - xx - yy/root3;
			bp = xx - yy/root3;
			cp = 2.0*yy/root3;
			
			if(isOrientationNormal == false) {
                // reverse axes orientation
			    bpt = bp;
			    bp = ap;
			    ap = cp;
			    cp = bpt;
			      				  
			}
			
			if (isRange0to100 == true) {
			    ap = ap*100; bp = bp*100; cp = cp*100;
			}

            data[0] = ap;
            data[1] = bp;
            data[2] = cp;
            return data;
        };

        this.dataToPixel = function(a, b, c) {
            return {
                x: 0,
                y: 0
            };
        };

        this.pixelToLiveString = function (pxi, pyi) {
            var dataVal = this.pixelToData(pxi, pyi);
            return dataVal[0].toExponential(4) + ', ' + dataVal[1].toExponential(4) + ', ' + dataVal[2].toExponential(4);
        };

        this.getTransformationEquations = function () {
            var rpEqn = 'rp = sqrt((x_pixel - ' + x0 + ')^2 + (y_pixel - ' + y0 + ')^2)/(' + L + ')',
                thetapEqn = 'thetap = atan2(('+y0+' -  y_pixel), (x_pixel - ' + x0 + ')) - (' + Math.atan2(-(y1-y0),x1-x0) + ')',
                apEqn = '1 - rp*(cos(thetap) - sin(thetap)/sqrt(3))', 
                bpEqn = 'rp*(cos(thetap) - sin(thetap)/sqrt(3))', 
                cpEqn = '2*rp*sin(thetap)/sqrt(3)',bpEqnt;

            if(isRange0to100) {
                apEqn = '100*(' + apEqn + ')'; 
                bpEqn = '100*(' + bpEqn + ')'; 
                cpEqn = '100*(' + cpEqn + ')';
            }

            apEqn = 'a_data = ' + apEqn;
            bpEqn = 'b_data = ' + bpEqn;
            cpEqn = 'c_data = ' + cpEqn;

            if(!isOrientationNormal) {
                bpEqnt = bpEqn;
			    bpEqn = apEqn;
			    apEqn = cpEqn;
			    cpEqn = bpEqnt;
            }

            return {
                pixelToData: [
                                rpEqn,
                                thetapEqn,
                                apEqn,
                                bpEqn,
                                cpEqn
                             ]
            };
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function() {
        return 3;
    };

    AxesObj.prototype.getDimensions = function() {
        return 3;
    };

    AxesObj.prototype.getAxesLabels = function() {
        return ['a', 'b', 'c'];
    };

    return AxesObj;
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.XYAxes = (function () {

    var AxesObj = function () {
        var calibration,
            isCalibrated = false,
            isLogScaleX = false,
            isLogScaleY = false,

            isXDate = false, isYDate = false,

            initialFormattingX, initialFormattingY,

            x1, x2, x3, x4, y1, y2, y3, y4,
            xmin, xmax, ymin, ymax, 
            a_mat = [0, 0, 0, 0], a_inv_mat = [0, 0, 0, 0],
            c_vec = [0, 0],

            processCalibration = function(cal, isLogX, isLogY) {

                if(cal.getCount() < 4) {
                    return false;
                }

                var cp1 = cal.getPoint(0),
                    cp2 = cal.getPoint(1),
                    cp3 = cal.getPoint(2),
                    cp4 = cal.getPoint(3),
                    ip = new wpd.InputParser(),
                    dat_mat, pix_mat;
                
                x1 = cp1.px;
                y1 = cp1.py;
                x2 = cp2.px;
                y2 = cp2.py;
                x3 = cp3.px;
                y3 = cp3.py;
                x4 = cp4.px;
                y4 = cp4.py;

                xmin = cp1.dx;
                xmax = cp2.dx;
                ymin = cp3.dy;
                ymax = cp4.dy;

                // Check for dates, validity etc.

                // Validate X-Axes:
                xmin = ip.parse(xmin);
                if(!ip.isValid) { return false; }
                isXDate = ip.isDate;
                xmax = ip.parse(xmax);
                if(!ip.isValid || (ip.isDate != isXDate)) { return false; }
                initialFormattingX = ip.formatting; 

                // Validate Y-Axes:
                ymin = ip.parse(ymin);
                if(!ip.isValid) { return false; }
                isYDate = ip.isDate;
                ymax = ip.parse(ymax);
                if(!ip.isValid || (ip.isDate != isYDate)) { return false; }
                initialFormattingY = ip.formatting; 

                isLogScaleX = isLogX;
                isLogScaleY = isLogY;

                // If x-axis is log scale
                if (isLogScaleX === true)
                {
                    xmin = Math.log(xmin)/Math.log(10);
                    xmax = Math.log(xmax)/Math.log(10);
                }

                // If y-axis is log scale
                if (isLogScaleY === true)
                {
                     ymin = Math.log(ymin)/Math.log(10);
                     ymax = Math.log(ymax)/Math.log(10);
                }

                dat_mat = [xmin-xmax, 0, 0, ymin - ymax];
                pix_mat = [x1 - x2, x3 - x4, y1 - y2, y3 - y4];

                a_mat = wpd.mat.mult2x2(dat_mat, wpd.mat.inv2x2(pix_mat));
                a_inv_mat = wpd.mat.inv2x2(a_mat);
                c_vec[0] = xmin - a_mat[0]*x1 - a_mat[1]*y1;
                c_vec[1] = ymin - a_mat[2]*x3 - a_mat[3]*y3;

                calibration = cal;
                return true;
            };
        
        this.getBounds = function() {
            return {
                x1: isLogScaleX ? Math.pow(10, xmin) : xmin,
                x2: isLogScaleX ? Math.pow(10, xmax) : xmax,
                y3: isLogScaleY ? Math.pow(10, ymin) : ymin,
                y4: isLogScaleY ? Math.pow(10, ymax) : ymax
            };
        };

        this.isCalibrated = function() {
            return isCalibrated;
        };

        this.calibrate = function(calib, isLogX, isLogY) {
            isCalibrated = processCalibration(calib, isLogX, isLogY);
            return isCalibrated;
        };

        this.pixelToData = function(pxi, pyi) {
            var data = [],
                xp, yp, xf, yf, dat_vec;

            xp = parseFloat(pxi);
            yp = parseFloat(pyi);

            dat_vec = wpd.mat.mult2x2Vec(a_mat, [xp, yp]);
            dat_vec[0] = dat_vec[0] + c_vec[0];
            dat_vec[1] = dat_vec[1] + c_vec[1];

            xf = dat_vec[0];
            yf = dat_vec[1];

            // if x-axis is log scale
            if (isLogScaleX === true)
                xf = Math.pow(10,xf);

            // if y-axis is log scale
            if (isLogScaleY === true)
                yf = Math.pow(10,yf);

            data[0] = xf;
            data[1] = yf;

            return data;
        };

        this.dataToPixel = function(x, y) {
            var xf, yf, dat_vec, rtnPix;

            if(isLogScaleX) {
                x = Math.log(x)/Math.log(10);
            }
            if(isLogScaleY) {
                y = Math.log(y)/Math.log(10);
            }

            dat_vec = [x - c_vec[0], y - c_vec[1]];
            rtnPix = wpd.mat.mult2x2Vec(a_inv_mat, dat_vec);
            
            xf = rtnPix[0];
            yf = rtnPix[1];

            return {
                x: xf,
                y: yf
            };
        };

        this.pixelToLiveString = function(pxi, pyi) {
            var rtnString = '',
                dataVal = this.pixelToData(pxi, pyi);
            if(isXDate) {
                rtnString += wpd.dateConverter.formatDateNumber(dataVal[0], initialFormattingX);
            } else {
                rtnString += dataVal[0].toExponential(4);
            }
            rtnString += ', ';

            if(isYDate) {
                rtnString += wpd.dateConverter.formatDateNumber(dataVal[1], initialFormattingY);
            } else {
                rtnString += dataVal[1].toExponential(4);
            }
            return rtnString;
        };

        this.isDate = function (varIndex) {
            if(varIndex === 0) {
                return isXDate;
            } else {
                return isYDate;
            }
        };

        this.getInitialDateFormat = function (varIndex) {
            if(varIndex === 0) {
                return initialFormattingX;
            } else {
                return initialFormattingY;
            }
        };

        this.isLogX = function () {
            return isLogScaleX;
        };

        this.isLogY = function () {
            return isLogScaleY;
        };

        this.getTransformationEquations = function() {
            var xdEqn = '(' + a_mat[0] + ')*x_pixel + (' + a_mat[1] + ')*y_pixel + (' + c_vec[0] + ')',
                ydEqn = '(' + a_mat[2] + ')*x_pixel + (' + a_mat[3] + ')*y_pixel + (' + c_vec[1] + ')',
                xpEqn = 'x_pixel = (' + a_inv_mat[0] + ')*x_data + (' + a_inv_mat[1] + ')*y_data + (' + (-a_inv_mat[0]*c_vec[0]-a_inv_mat[1]*c_vec[1]) + ')',
                ypEqn = 'y_pixel = (' + a_inv_mat[2] + ')*x_data + (' + a_inv_mat[3] + ')*y_data + (' + (-a_inv_mat[2]*c_vec[0]-a_inv_mat[3]*c_vec[1]) + ')';

            if (isLogScaleX) {
                xdEqn = 'x_data = pow(10, ' + xdEqn + ')';
            } else {
                xdEqn = 'x_data = ' + xdEqn;
            }
            
            if (isLogScaleY) {
                ydEqn = 'y_data = pow(10, ' + ydEqn + ')';
            } else {
                ydEqn = 'y_data = ' + ydEqn;
            }

            if(isLogScaleX || isLogScaleY) {
                return {
                     pixelToData: [xdEqn, ydEqn]
                };
            }

            return {
                pixelToData: [xdEqn, ydEqn],
                dataToPixel: [xpEqn, ypEqn]
            };
        };

        this.getOrientation = function() {
            // Used by histogram auto-extract method only at the moment.
            // Just indicate increasing y-axis at the moment so that we can work with histograms.
            return {
                axes: 'Y',
                direction: 'increasing',
                angle: 90
            };
        };
    };

    AxesObj.prototype.numCalibrationPointsRequired = function() {
        return 4;
    };

    AxesObj.prototype.getDimensions = function() {
        return 2;
    };

    AxesObj.prototype.getAxesLabels = function() {
        return ['X', 'Y'];
    };

    return AxesObj;

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.dataSeriesManagement = (function () {

    var nameIndex = 1;
    
    function updateSeriesList() {
    }

    function manage() {
        if(!wpd.appData.isAligned()) {
            wpd.messagePopup.show(wpd.gettext('manage-datasets'), wpd.gettext('manage-datasets-text'));
        } else {
            var $nameField = document.getElementById('manage-data-series-name'),
                $pointCount = document.getElementById('manage-data-series-point-count'),
                $datasetList = document.getElementById('manage-data-series-list'),
                plotData = wpd.appData.getPlotData(),
                activeDataSeries = plotData.getActiveDataSeries(),
                seriesList = plotData.getDataSeriesNames(),
                activeSeriesIndex = plotData.getActiveDataSeriesIndex(),
                listHtml = '',
                i;

            $nameField.value = activeDataSeries.name;
            $pointCount.innerHTML = activeDataSeries.getCount();
            for(i = 0; i < seriesList.length; i++) {
                listHtml += '<option value="'+ i + '">' + seriesList[i] + '</option>';
            }
            $datasetList.innerHTML = listHtml;
            $datasetList.selectedIndex = activeSeriesIndex;

            // TODO: disable delete button if only one series is present
            wpd.popup.show('manage-data-series-window');
        }
    }

    function addSeries() {
        var plotData = wpd.appData.getPlotData(),
            seriesName = 'Dataset ' + nameIndex,
            index = plotData.dataSeriesColl.length;
        
        close();
        plotData.dataSeriesColl[index] = new wpd.DataSeries();
        plotData.dataSeriesColl[index].name = seriesName;
        plotData.setActiveDataSeriesIndex(index);
        updateApp();
        nameIndex++;
        manage();
    }

    function deleteSeries() {
        // if this is the only dataset, then disallow delete!
        close();

        if(wpd.appData.getPlotData().dataSeriesColl.length === 1) {
            wpd.messagePopup.show(wpd.gettext('can-not-delete-dataset'), wpd.gettext('can-not-delete-dataset-text'), manage);
            return;
        }

        wpd.okCancelPopup.show(wpd.gettext('delete-dataset'), wpd.gettext('delete-dataset-text'), function() {
            // delete the dataset
            var plotData = wpd.appData.getPlotData(),
                index = plotData.getActiveDataSeriesIndex();
            plotData.dataSeriesColl.splice(index,1);
            plotData.setActiveDataSeriesIndex(0);
            manage();
        }, function() {
            // 'cancel'
            manage();
        });
    }

    function viewData() {
        close();
        wpd.dataTable.showTable();
    }

    function changeSelectedSeries() {
        var $list = document.getElementById('manage-data-series-list'),
            plotData = wpd.appData.getPlotData();

        close();
        plotData.setActiveDataSeriesIndex($list.selectedIndex);
        updateApp();
        manage();
    }

    function updateApp() {
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.autoExtraction.updateDatasetControl();
        wpd.acquireData.updateDatasetControl();
        wpd.dataPointCounter.setCount();
    }

    function editSeriesName() {
        var activeSeries = wpd.appData.getPlotData().getActiveDataSeries(),
            $name = document.getElementById('manage-data-series-name');
        close();
        activeSeries.name = $name.value;
        updateApp(); // overkill, but not too bad.
        manage();
    }

    function close() {
        wpd.popup.close('manage-data-series-window');
    }

    return {
        manage: manage,
        addSeries: addSeries,
        deleteSeries: deleteSeries,
        viewData: viewData,
        changeSelectedSeries: changeSelectedSeries,
        editSeriesName: editSeriesName
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.dataTable = (function () {

    var dataProvider,
        dataCache,
        sortedData,
        tableText;
    
    function showPlotData() {
        dataProvider = wpd.plotDataProvider;
        show();
    }

    function showAngleData() {
        dataProvider = wpd.measurementDataProvider;
        dataProvider.setDataSource('angle');
        show();
    }

    function showDistanceData() {
        dataProvider = wpd.measurementDataProvider;
        dataProvider.setDataSource('distance');
        show();
    }

    function show() {
        wpd.graphicsWidget.removeTool();
        wpd.popup.show('csvWindow');
        refresh();
    }

    function refresh() {
        dataCache = dataProvider.getData();
        setupControls();
        sortRawData();
        makeTable();
    }

    function setupControls() {

        var $datasetControl = document.getElementById('data-table-dataset-control'),
            $datasetList = document.getElementById('data-table-dataset-list'),
            datasetNames = dataProvider.getDatasetNames(),
            $sortingVariables = document.getElementById('data-sort-variables'),
            $variableNames = document.getElementById('dataVariables'),
            $dateFormattingContainer = document.getElementById('data-date-formatting-container'),
            $dateFormatting = document.getElementById('data-date-formatting'),
            i,
            datasetHTML = '',
            sortingHTML = '',
            dateFormattingHTML = '',
            isAnyVariableDate = false;

        // Datasets
        for (i = 0; i < datasetNames.length; i++) {
            datasetHTML += '<option>' + datasetNames[i] + '</option>';
        }
        $datasetList.innerHTML = datasetHTML;
        $datasetList.selectedIndex = dataProvider.getDatasetIndex();

        // Variable Names
        $variableNames.innerHTML = dataCache.fields.join(', ');

        $dateFormattingContainer.style.display = 'none';
        sortingHTML += '<option value="raw">' + wpd.gettext('raw') + '</option>';
        for(i = 0; i < dataCache.fields.length; i++) {

            // Sorting
            if(dataCache.isFieldSortable[i]) {
                sortingHTML += '<option value="' + dataCache.fields[i] + '">' + dataCache.fields[i] + '</option>';
            }

            // Date formatting
            if(dataCache.fieldDateFormat[i] != null) {
                dateFormattingHTML += '<p>' + dataCache.fields[i] + ' <input type="text" length="15" value="' + dataCache.fieldDateFormat[i] + '" id="data-format-string-' + i + '"/></p>';
                isAnyVariableDate = true;
            }
        }
        if(dataCache.allowConnectivity) {
            sortingHTML += '<option value="NearestNeighbor">' + wpd.gettext('nearest-neighbor') + '</option>';
        }
        $sortingVariables.innerHTML = sortingHTML;
        updateSortingControls();

        if(isAnyVariableDate) {
            $dateFormattingContainer.style.display = 'inline-block';
            $dateFormatting.innerHTML = dateFormattingHTML;
        } else {
            $dateFormattingContainer.style.display = 'hidden';
        }
    }

    function changeDataset() {
        var $datasetList = document.getElementById('data-table-dataset-list');
        dataProvider.setDatasetIndex($datasetList.selectedIndex);
        refresh();
    }

    function updateSortingControls() {
        var sortingKey = document.getElementById('data-sort-variables').value,
            $sortingOrder = document.getElementById('data-sort-order'),
            isConnectivity = sortingKey === 'NearestNeighbor',
            isRaw = sortingKey === 'raw';
        
        if(isConnectivity || isRaw) {
            $sortingOrder.setAttribute('disabled', true);
        } else {
            $sortingOrder.removeAttribute('disabled');
        }
    }

    function reSort() {
        updateSortingControls();
        sortRawData();
        makeTable();
    }

    function sortRawData() {

        if(dataCache == null || dataCache.rawData == null) {
            return;
        }

        sortedData = dataCache.rawData.slice(0);
        var sortingKey = document.getElementById('data-sort-variables').value,
            sortingOrder = document.getElementById('data-sort-order').value,
            isAscending = sortingOrder === 'ascending',
            isRaw = sortingKey === 'raw',
            isConnectivity = sortingKey === 'NearestNeighbor',
            dataIndex,
            fieldCount = dataCache.fields.length;

        if(isRaw) {
            return;
        }

        if(!isConnectivity) {
            dataIndex = dataCache.fields.indexOf(sortingKey);
            if(dataIndex < 0) {
                return;
            }
            sortedData.sort(function(a, b) {
                if(a[dataIndex] > b[dataIndex]) {
                    return isAscending ? 1: -1;
                } else if (a[dataIndex] < b[dataIndex]) {
                    return isAscending ? -1 : 1;
                }
                return 0;
            });
            return;
        }

        if(isConnectivity) {
            var mindist, compdist, minindex,
                rowi, rowcompi,
                rowCount = sortedData.length,
                connFieldIndices = dataCache.connectivityFieldIndices,
                fi, cfi,
                swp;

            for(rowi = 0; rowi < rowCount - 1; rowi++) {
                minindex = -1;
                
                // loop through all other points and find the nearest next neighbor
                for(rowcompi = rowi + 1; rowcompi < rowCount; rowcompi++) {
                    compdist = 0;
                    for(fi = 0; fi < connFieldIndices.length; fi++) {
                        cfi = connFieldIndices[fi];       
                        compdist += (sortedData[rowi][cfi] - sortedData[rowcompi][cfi])*(sortedData[rowi][cfi] - sortedData[rowcompi][cfi]);
                    }

                    if((compdist < mindist) || (minindex === -1)) {
                        mindist = compdist;
                        minindex = rowcompi;
                    }
                }
                
                // swap (minindex) and (rowi+1) rows
                for(fi = 0; fi < dataCache.fields.length; fi++) {
                    swp = sortedData[minindex][fi];
                    sortedData[minindex][fi] = sortedData[rowi+1][fi];
                    sortedData[rowi+1][fi] = swp;
                }
            }

        }
    }

    function makeTable() {
        if(sortedData == null) { return; }

        var $digitizedDataTable = document.getElementById('digitizedDataTable'),
            numFormattingDigits = parseInt(document.getElementById('data-number-format-digits').value, 10),
            numFormattingStyle = document.getElementById('data-number-format-style').value,
            colSeparator = document.getElementById('data-number-format-separator').value,
            rowi,
            coli,
            rowValues,
            dateFormattingStrings = [];

        // "\t" in the column separator should translate to a tab:
        colSeparator = colSeparator.replace(/[^\\]\\t/, "\t").replace(/^\\t/, "\t");

        tableText = '';
        for(rowi = 0; rowi < sortedData.length; rowi++) {
            rowValues = [];
            for(coli = 0; coli < dataCache.fields.length; coli++) {
                if(dataCache.fieldDateFormat[coli] != null) { // Date
                    if(dateFormattingStrings[coli] === undefined) {
                        dateFormattingStrings[coli] = document.getElementById('data-format-string-'+ coli).value;
                    }
                    rowValues[coli] = wpd.dateConverter.formatDateNumber(sortedData[rowi][coli], dateFormattingStrings[coli]);
                } else { // Non-date values
                    if(typeof sortedData[rowi][coli] === 'string') {
                        rowValues[coli] = sortedData[rowi][coli];
                    } else {
                        if(numFormattingStyle === 'fixed' && numFormattingDigits >= 0) {
                            rowValues[coli] = sortedData[rowi][coli].toFixed(numFormattingDigits);
                        } else if(numFormattingStyle === 'precision' && numFormattingDigits >= 0) {
                            rowValues[coli] = sortedData[rowi][coli].toPrecision(numFormattingDigits);
                        } else if(numFormattingStyle === 'exponential' && numFormattingDigits >= 0) {
                            rowValues[coli] = sortedData[rowi][coli].toExponential(numFormattingDigits);
                        } else {
                            rowValues[coli] = sortedData[rowi][coli];
                        }
                    }
                }
            }
            tableText += rowValues.join(colSeparator);
            tableText += '\n';
        }
        $digitizedDataTable.value = tableText;
    }

    function selectAll() {
        var $digitizedDataTable = document.getElementById('digitizedDataTable');
        $digitizedDataTable.focus();
        $digitizedDataTable.select();
    }

    function generateCSV() {
        var datasetName = dataProvider.getDatasetNames()[dataProvider.getDatasetIndex()];
        wpd.download.csv(JSON.stringify(tableText), datasetName);
    }

    function exportToPlotly() {
        if (sortedData == null) { return; }
        var plotlyData = { "data": [] },
            rowi,
            coli,
            fieldName;

        plotlyData.data[0] = {};

        for (rowi = 0; rowi < sortedData.length; rowi++) {
            for (coli = 0; coli < dataCache.fields.length; coli++) {

                fieldName = dataCache.fields[coli];
                // Replace first two to keep plotly happy:
                if(coli === 0) {
                    fieldName = 'x';
                } else if(coli === 1) {
                    fieldName = 'y';
                }

                if (rowi === 0) {
                    plotlyData.data[0][fieldName] = [];
                }

                if (dataCache.fieldDateFormat[coli] != null) {
                    plotlyData.data[0][fieldName][rowi] = wpd.dateConverter.formatDateNumber(sortedData[rowi][coli], 'yyyy-mm-dd');
                } else {
                    plotlyData.data[0][fieldName][rowi] = sortedData[rowi][coli];
                }
            }
        }

        wpd.plotly.send(plotlyData);
    }

    return {
        showTable: showPlotData,
        showAngleData: showAngleData,
        showDistanceData: showDistanceData,
        updateSortingControls: updateSortingControls,
        reSort: reSort,
        selectAll: selectAll,
        generateCSV: generateCSV,
        exportToPlotly: exportToPlotly,
        changeDataset: changeDataset
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

/* Multi-layered canvas widget to display plot, data, graphics etc. */
var wpd = wpd || {};
wpd.graphicsWidget = (function () {

    var $mainCanvas, // original picture is displayed here
        $dataCanvas, // data points
        $drawCanvas, // selection region graphics etc
        $hoverCanvas, // temp graphics while drawing
        $topCanvas, // top level, handles mouse events

        $oriImageCanvas,
        $oriDataCanvas,

        $canvasDiv,

        mainCtx,
        dataCtx,
        drawCtx,
        hoverCtx,
        topCtx,

        oriImageCtx,
        oriDataCtx,

        width,
        height,
        originalWidth,
        originalHeight,
        
        aspectRatio,
        displayAspectRatio,
        
        originalImageData,
        scaledImage,
        zoomRatio,
        extendedCrosshair = false,
        hoverTimer,
        
        activeTool,
        repaintHandler,
        
        isCanvasInFocus = false,
        
        firstLoad = true;
        

    function posn(ev) { // get screen pixel from event
        var mainCanvasPosition = $mainCanvas.getBoundingClientRect();
        return {
            x: parseInt(ev.pageX - (mainCanvasPosition.left + window.pageXOffset), 10),
            y: parseInt(ev.pageY - (mainCanvasPosition.top + window.pageYOffset), 10)
        };
    }

    // get image pixel when screen pixel is provided
    function imagePx(screenX, screenY) {
        return {
            x: screenX/zoomRatio,
            y: screenY/zoomRatio
        };
    }

    // get screen pixel when image pixel is provided
    function screenPx(imageX, imageY) {
        return {
            x: imageX*zoomRatio,
            y: imageY*zoomRatio
        };
    }

    function getDisplaySize() {
        return {
            width: width,
            height: height
        };
    }

    function getImageSize() {
        return {
            width: originalWidth,
            height: originalHeight
        };
    }

    function getAllContexts() {
        return {
            mainCtx: mainCtx,
            dataCtx: dataCtx,
            drawCtx: drawCtx,
            hoverCtx: hoverCtx,
            topCtx: topCtx,
            oriImageCtx: oriImageCtx,
            oriDataCtx: oriDataCtx
        };
    }
 
    function resize(cwidth, cheight) {

        cwidth = parseInt(cwidth, 10);
        cheight = parseInt(cheight, 10);

        $canvasDiv.style.width = cwidth + 'px';
        $canvasDiv.style.height = cheight + 'px';

        $mainCanvas.width = cwidth;
        $dataCanvas.width = cwidth;
        $drawCanvas.width = cwidth;
        $hoverCanvas.width = cwidth;
        $topCanvas.width = cwidth;

        $mainCanvas.height = cheight;
        $dataCanvas.height = cheight;
        $drawCanvas.height = cheight;
        $hoverCanvas.height = cheight;
        $topCanvas.height = cheight;

        displayAspectRatio = cwidth/(cheight*1.0);

        width = cwidth;
        height = cheight;

        drawImage();
    }

    function resetAllLayers() {
        $mainCanvas.width = $mainCanvas.width;
        resetDrawingLayers();
    }

    function resetDrawingLayers() {
        $dataCanvas.width = $dataCanvas.width;
        $drawCanvas.width = $drawCanvas.width;
        $hoverCanvas.width = $hoverCanvas.width;
        $topCanvas.width = $topCanvas.width;
        $oriDataCanvas.width = $oriDataCanvas.width;
    }

    function drawImage() {
        if(originalImageData == null) return;
        
        mainCtx.fillStyle = "rgb(255, 255, 255)";
        mainCtx.fillRect(0, 0, width, height);
        mainCtx.drawImage($oriImageCanvas, 0, 0, width, height);

        if(repaintHandler != null && repaintHandler.onRedraw != undefined) {
            repaintHandler.onRedraw();
        }

        if(activeTool != null && activeTool.onRedraw != undefined) {
            activeTool.onRedraw();
        }
                
    }

    function forceHandlerRepaint() {
        if(repaintHandler != null && repaintHandler.onForcedRedraw != undefined) {
            repaintHandler.onForcedRedraw();
        }
    }

    function setRepainter(fhandle) {
        
        if(repaintHandler != null && repaintHandler.painterName != undefined && fhandle != null && fhandle.painterName != undefined) {
            if(repaintHandler.painterName == fhandle.painterName) {
                return;  // Avoid same handler to be attached repeatedly.
            }
        }

        if(repaintHandler != null && repaintHandler.onRemove != undefined) {
            repaintHandler.onRemove();
        }
        repaintHandler = fhandle;
        if(repaintHandler != null && repaintHandler.onAttach != undefined) {
            repaintHandler.onAttach();
        }
    }

    function getRepainter() {
        return repaintHandler;
    }

    function removeRepainter() {
        if(repaintHandler != null && repaintHandler.onRemove != undefined) {
            repaintHandler.onRemove();
        }
        repaintHandler = null;
    }

    function copyImageDataLayerToScreen() {
        dataCtx.drawImage($oriDataCanvas, 0, 0, width, height); 
    }

    function zoomIn() {
        setZoomRatio(zoomRatio*1.2);
    }

    function zoomOut() {
        setZoomRatio(zoomRatio/1.2);
    }

    function zoomFit() {
        var viewportSize = wpd.layoutManager.getGraphicsViewportSize();
        resize(viewportSize.width, viewportSize.height);

        if(displayAspectRatio > aspectRatio) {
            zoomRatio = height/(originalHeight*1.0);
            resize(height*aspectRatio, height);
        } else {
            zoomRatio = width/(originalWidth*1.0);
            resize(width, width/aspectRatio);
        }
    }

    function zoom100perc() {
        setZoomRatio(1.0);
    }

    function setZoomRatio(zratio) {
        zoomRatio = zratio;
        resize(originalWidth*zoomRatio, originalHeight*zoomRatio);
    }

    function getZoomRatio() {
        return zoomRatio;
    }

    function resetData() {
        $oriDataCanvas.width = $oriDataCanvas.width;
        $dataCanvas.width = $dataCanvas.width;
    }

    function resetHover() {
        $hoverCanvas.width = $hoverCanvas.width;
    }

    function toggleExtendedCrosshair(ev) { // called when backslash is hit
        if (ev.keyCode === 220) {
            ev.preventDefault();
            toggleExtendedCrosshairBtn(); 
        }
    }

    function toggleExtendedCrosshairBtn() { // called directly when toolbar button is hit
        extendedCrosshair = !(extendedCrosshair);
        var $crosshairBtn = document.getElementById('extended-crosshair-btn');
        if(extendedCrosshair) {
            $crosshairBtn.classList.add('pressed-button');
        } else {
            $crosshairBtn.classList.remove('pressed-button');
        }
        $hoverCanvas.width = $hoverCanvas.width;
    }

    function hoverOverCanvas(ev) {
        var pos = posn(ev),
            xpos = pos.x,
            ypos = pos.y,
            imagePos = imagePx(xpos, ypos);

        if(extendedCrosshair) {
            $hoverCanvas.width = $hoverCanvas.width;
            hoverCtx.strokeStyle = "rgba(0,0,0, 0.5)";
            hoverCtx.beginPath();
            hoverCtx.moveTo(xpos, 0);
            hoverCtx.lineTo(xpos, height);
            hoverCtx.moveTo(0, ypos);
            hoverCtx.lineTo(width, ypos);
            hoverCtx.stroke();
        }

        setZoomImage(imagePos.x, imagePos.y);
        wpd.zoomView.setCoords(imagePos.x, imagePos.y);
    }

    function setZoomImage(ix, iy) {
        var zsize = wpd.zoomView.getSize(),
            zratio = wpd.zoomView.getZoomRatio(),
            ix0, iy0,
            zw, zh,
            iw, ih,
            idata, ddata,
            ixmin, iymin, ixmax, iymax,
            zxmin = 0, zymin = 0, zxmax = zsize.width, zymax = zsize.height,
            xcorr, ycorr,
            alpha;

        iw = zsize.width/zratio;
        ih = zsize.height/zratio;
        
        ix0 = ix - iw/2.0; iy0 = iy - ih/2.0;
        
        ixmin = ix0; iymin = iy0;
        ixmax = ix0 + iw; iymax = iy0 + ih;

        if(ix0 < 0) {
            ixmin = 0;
            zxmin = -ix0*zratio;
        }
        if(iy0 < 0) {
            iymin = 0;
            zymin = -iy0*zratio;
        }
        if(ix0 + iw >= originalWidth) {
            ixmax = originalWidth;
            zxmax = zxmax - zratio*(originalWidth - (ix0 + iw));
        }
        if(iy0 + ih >= originalHeight) {
            iymax = originalHeight;
            zymax = zymax - zratio*(originalHeight - (iy0 + ih));
        }
        idata = oriImageCtx.getImageData(parseInt(ixmin, 10), 
                                         parseInt(iymin, 10), 
                                         parseInt(ixmax-ixmin, 10), 
                                         parseInt(iymax-iymin, 10));

        ddata = oriDataCtx.getImageData(parseInt(ixmin, 10), 
                                         parseInt(iymin, 10), 
                                         parseInt(ixmax-ixmin, 10), 
                                         parseInt(iymax-iymin, 10));

        for(var index = 0; index < ddata.data.length; index+=4) {
            if(ddata.data[index] != 0 || ddata.data[index+1] !=0 || ddata.data[index+2] != 0) {
                alpha = ddata.data[index+3]/255;
                idata.data[index] = (1-alpha)*idata.data[index] + alpha*ddata.data[index];
                idata.data[index+1] = (1-alpha)*idata.data[index+1] + alpha*ddata.data[index+1];
                idata.data[index+2] = (1-alpha)*idata.data[index+2] + alpha*ddata.data[index+2];
            }
        }

        // Make this accurate to subpixel level
        xcorr = zratio*(parseInt(ixmin,10) - ixmin);
        ycorr = zratio*(parseInt(iymin,10) - iymin);

        wpd.zoomView.setZoomImage(idata, parseInt(zxmin + xcorr, 10), 
                                     parseInt(zymin + ycorr, 10), 
                                     parseInt(zxmax - zxmin, 10), 
                                     parseInt(zymax - zymin, 10));
    }

    function updateZoomOnEvent(ev) {
        var pos = posn(ev),
            xpos = pos.x,
            ypos = pos.y,
            imagePos = imagePx(xpos, ypos);
        setZoomImage(imagePos.x, imagePos.y);
        wpd.zoomView.setCoords(imagePos.x, imagePos.y);
    }

    function updateZoomToImagePosn(x, y) {
        setZoomImage(x, y);
        wpd.zoomView.setCoords(x, y);
    }

    function hoverOverCanvasHandler(ev) {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(hoverOverCanvas(ev), 10);
    }

    function getDroppedUri(ev, callback) {
        var uriFilter = function(uri) {
            return (uri.indexOf("http://") == 0 || uri.indexOf("https://") == 0);
        };
        var uriList = ev.dataTransfer.getData("text/plain");
        if (uriList == null) {
            return;
        }
        var uri = uriList.split(/\n/).filter(uriFilter)[0];
        if (uri == null) {
            return;
        }
        callback(uri);
    }

    function wrapCors(uri) {
        return (wpd.corsProxy == null ? uri : wpd.corsProxy + "/" + uri);
    }

    function dropHandler(ev) {
        var files = ev.dataTransfer.files;
        if (files.length === 1) {
            wpd.busyNote.show();
            fileLoader(files[0]);
        } else {
            getDroppedUri(ev, function(uri) {
                wpd.busyNote.show();
                loadImageFromSrc(wrapCors(uri));
            });
        }
    }

    function pasteHandler(ev) {
        if(ev.clipboardData !== undefined) {
            var items = ev.clipboardData.items;
            if(items !== undefined) {
                for(var i = 0; i < items.length; i++) {
                    if(items[i].type.indexOf("image") !== -1) {
                        wpd.busyNote.show();
                        var blob = items[i].getAsFile();
                        var URLObj = window.URL || window.webkitURL;
                        var source = URLObj.createObjectURL(blob);
                        fileLoader(blob);
                    }
                }
            }
        }
    }


    function init() {
        $mainCanvas = document.getElementById('mainCanvas');
        $dataCanvas = document.getElementById('dataCanvas');
        $drawCanvas = document.getElementById('drawCanvas');
        $hoverCanvas = document.getElementById('hoverCanvas');
        $topCanvas = document.getElementById('topCanvas');

        $oriImageCanvas = document.createElement('canvas');
        $oriDataCanvas = document.createElement('canvas');

        mainCtx = $mainCanvas.getContext('2d');
        dataCtx = $dataCanvas.getContext('2d');
        hoverCtx = $hoverCanvas.getContext('2d');
        topCtx = $topCanvas.getContext('2d');
        drawCtx = $drawCanvas.getContext('2d');

        oriImageCtx = $oriImageCanvas.getContext('2d');
        oriDataCtx = $oriDataCanvas.getContext('2d');

        $canvasDiv = document.getElementById('canvasDiv');

        // Extended crosshair
        document.addEventListener('keydown', function(ev) {
            if(isCanvasInFocus) {
                toggleExtendedCrosshair(ev);
            }
        }, false);

        // hovering over canvas
        $topCanvas.addEventListener('mousemove', hoverOverCanvasHandler, false);

        // drag over canvas
        $topCanvas.addEventListener('dragover', function(evt) {
                evt.preventDefault();
            }, true);
        $topCanvas.addEventListener("drop", function(evt) { 
                evt.preventDefault(); 
                dropHandler(evt);
            }, true);

        $topCanvas.addEventListener("mousemove", onMouseMove, false);
        $topCanvas.addEventListener("click", onMouseClick, false);
        $topCanvas.addEventListener("mouseup", onMouseUp, false);
        $topCanvas.addEventListener("mousedown", onMouseDown, false);
        $topCanvas.addEventListener("mouseout", onMouseOut, true);
        document.addEventListener("mouseup", onDocumentMouseUp, false);

        document.addEventListener("mousedown", function(ev) {
            if(ev.target === $topCanvas) {
                isCanvasInFocus = true;
            } else {
                isCanvasInFocus = false;
            }
        }, false);
        document.addEventListener("keydown", function (ev) {
            if(isCanvasInFocus) {
                onKeyDown(ev);
            }
        }, true);
        
        wpd.zoomView.initZoom();
        
        document.getElementById('fileLoadBox').addEventListener("change", loadNewFile); 

        // Paste image from clipboard
        window.addEventListener('paste', function(event) {pasteHandler(event);}, false);
    }

    function loadImage(originalImage) {
        
        if($mainCanvas == null) {
            init();
        }
        wpd.appData.reset();
        wpd.sidebar.clear();
        removeTool();
        removeRepainter();
        originalWidth = originalImage.width;
        originalHeight = originalImage.height;
        aspectRatio = originalWidth/(originalHeight*1.0);
        $oriImageCanvas.width = originalWidth;
        $oriImageCanvas.height = originalHeight;
        $oriDataCanvas.width = originalWidth;
        $oriDataCanvas.height = originalHeight;
        oriImageCtx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
        originalImageData = oriImageCtx.getImageData(0, 0, originalWidth, originalHeight);
        resetAllLayers();
        zoomFit();
        wpd.appData.plotLoaded(originalImageData);
        
        wpd.busyNote.close();

        // TODO: move this logic outside the graphics widget!
        if (firstLoad === false) {
            wpd.popup.show('axesList');
        }
        firstLoad = false;
    }

    function loadImageFromSrc(imgSrc, callback) {
        var originalImage = document.createElement('img');
        if (imgSrc.substring(0, 5) !== "data:") {
            originalImage.crossOrigin = "Anonymous";
        }
        originalImage.onload = function () {
            loadImage(originalImage);
            if (callback != null) {
                callback();
            }
        };
        originalImage.src = imgSrc;
    }

    function loadImageFromData(idata, iwidth, iheight, doReset, keepZoom) {        
        removeTool();
        removeRepainter();
        originalWidth = iwidth;
        originalHeight = iheight;
        aspectRatio = originalWidth/(originalHeight*1.0);
        $oriImageCanvas.width = originalWidth;
        $oriImageCanvas.height = originalHeight;
        $oriDataCanvas.width = originalWidth;
        $oriDataCanvas.height = originalHeight;
        oriImageCtx.putImageData(idata, 0, 0);
        originalImageData = idata;
        resetAllLayers();
        
        if(!keepZoom) {
            zoomFit();
        } else {
            setZoomRatio(zoomRatio);
        }

        if(doReset) {
            wpd.appData.reset();
            wpd.appData.plotLoaded(originalImageData);
        }
    }

    function fileLoader(fileInfo) {
        if(fileInfo.type.match("image.*")) {
            var droppedFile = new FileReader();
            droppedFile.onload = function() {
                var imageInfo = droppedFile.result;
                loadImageFromSrc(imageInfo);
            };
            droppedFile.readAsDataURL(fileInfo);
        } else {
            wpd.messagePopup.show(wpd.gettext('invalid-file'), wpd.gettext('invalid-file-text'));
            wpd.busyNote.close();
        }
    }


    function loadNewFile() {
        var fileLoadElem = document.getElementById('fileLoadBox');
        if(fileLoadElem.files.length == 1) {
            var fileInfo = fileLoadElem.files[0];
            wpd.busyNote.show();
            fileLoader(fileInfo);
        }
        wpd.popup.close('loadNewImage');
    }

    function saveImage() {
        var exportCanvas = document.createElement('canvas'),
            exportCtx = exportCanvas.getContext('2d'),
            exportData,
            di,
            dLayer,
            alpha;
        exportCanvas.width = originalWidth;
        exportCanvas.height = originalHeight;
        exportCtx.drawImage($oriImageCanvas, 0, 0, originalWidth, originalHeight);
        exportData = exportCtx.getImageData(0, 0, originalWidth, originalHeight);
        dLayer = oriDataCtx.getImageData(0, 0, originalWidth, originalHeight);
        for(di = 0; di < exportData.data.length; di+=4) {
            if(dLayer.data[di] != 0 || dLayer.data[di+1] != 0 || dLayer.data[di+2] != 0) {
                alpha = dLayer.data[di+3]/255;
                exportData.data[di] = (1 - alpha)*exportData.data[di] + alpha*dLayer.data[di];
                exportData.data[di+1] = (1 - alpha)*exportData.data[di + 1] + alpha*dLayer.data[di+1];
                exportData.data[di+2] = (1 - alpha)*exportData.data[di + 2] + alpha*dLayer.data[di+2];
            }
        }
        exportCtx.putImageData(exportData, 0, 0);
        window.open(exportCanvas.toDataURL(), "_blank");
    }

    // run an external operation on the image data. this would normally mean a reset.
    function runImageOp(operFn, doReset) {
       var opResult = operFn(originalImageData, originalWidth, originalHeight);
       loadImageFromData(opResult.imageData, opResult.width, opResult.height, doReset, opResult.keepZoom);
    }

    function getImageData() {
        return originalImageData;
    }

    function getImageDataURL(type, encoderOptions) {
        return $oriImageCanvas && $oriImageCanvas.toDataURL(type, encoderOptions);
    }

    function setTool(tool) {
        if(activeTool != null && activeTool.onRemove != undefined) {
            activeTool.onRemove();
        }
        activeTool = tool;
        if(activeTool != null && activeTool.onAttach != undefined) {
            activeTool.onAttach();
        }
    }

    function removeTool() {
        if(activeTool != null && activeTool.onRemove != undefined) {
            activeTool.onRemove();
        }
        activeTool = null;
    }

    function onMouseMove(ev) {
        if(activeTool != null && activeTool.onMouseMove != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onMouseMove(ev, pos, imagePos);
        }
    }

    function onMouseClick(ev) {
        if(activeTool != null && activeTool.onMouseClick != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onMouseClick(ev, pos, imagePos);
        }
    }

    function onDocumentMouseUp(ev) {
        if(activeTool != null && activeTool.onDocumentMouseUp != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onDocumentMouseUp(ev, pos, imagePos);
        }
    }

    function onMouseUp(ev) {
        if(activeTool != null && activeTool.onMouseUp != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onMouseUp(ev, pos, imagePos);
        }
    }

    function onMouseDown(ev) {
        if(activeTool != null && activeTool.onMouseDown != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onMouseDown(ev, pos, imagePos);
        }
    }

    function onMouseOut(ev) {
        if(activeTool != null && activeTool.onMouseOut != undefined) {
            var pos = posn(ev),
                xpos = pos.x,
                ypos = pos.y,
                imagePos = imagePx(xpos, ypos);
            activeTool.onMouseOut(ev, pos, imagePos);
        }
    }

    function onKeyDown(ev) {
        if(activeTool != null && activeTool.onKeyDown != undefined) {
            activeTool.onKeyDown(ev);
        }
    }

    return {
        zoomIn: zoomIn,
        zoomOut: zoomOut,
        zoomFit: zoomFit,
        zoom100perc: zoom100perc,
        toggleExtendedCrosshairBtn: toggleExtendedCrosshairBtn,
        setZoomRatio: setZoomRatio,
        getZoomRatio: getZoomRatio,

        loadImageFromURL: loadImageFromSrc,
        loadImageFromData: loadImageFromData,
        load: loadNewFile,
        runImageOp: runImageOp,

        setTool: setTool,
        removeTool: removeTool,

        getAllContexts: getAllContexts,
        resetData: resetData,
        resetHover: resetHover,
        imagePx: imagePx,
        screenPx: screenPx,

        updateZoomOnEvent: updateZoomOnEvent,
        updateZoomToImagePosn: updateZoomToImagePosn,

        getDisplaySize: getDisplaySize,
        getImageDataURL: getImageDataURL,
        getImageSize: getImageSize,

        copyImageDataLayerToScreen: copyImageDataLayerToScreen,
        setRepainter: setRepainter,
        removeRepainter: removeRepainter,
        forceHandlerRepaint: forceHandlerRepaint,
        getRepainter: getRepainter,

        saveImage: saveImage
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

// layoutManager.js - manage layout of main sections on the screen.
var wpd = wpd || {};
wpd.layoutManager = (function () {
    var layoutTimer,
        $graphicsContainer,
        $sidebarContainer,
        $sidebarControlsContainer,
        $mainContainer;

    // Redo layout when window is resized
    function adjustLayout() {
        var windowWidth = parseInt(document.body.offsetWidth,10),
            windowHeight = parseInt(document.body.offsetHeight,10);

        $sidebarContainer.style.height = windowHeight + 'px';
        $sidebarControlsContainer.style.height = windowHeight - 280 + 'px';
        $mainContainer.style.width = windowWidth - $sidebarContainer.offsetWidth - 5 + 'px';
        $mainContainer.style.height = windowHeight + 'px';
        $graphicsContainer.style.height = windowHeight - 44 + 'px';
        wpd.sidebar.resize();
    }

    function getGraphicsViewportSize() {
        return {
            width: $graphicsContainer.offsetWidth,
            height: $graphicsContainer.offsetHeight
        };
    }

    // event handler
    function adjustLayoutOnResize(ev) {
        clearTimeout(layoutTimer);
        layoutTimer = setTimeout(adjustLayout, 80);
    }
 
    // Set initial layout. Called right when the app is loaded.
    function initialLayout() {
        // do initial layout and also bind to the window resize event
        $graphicsContainer = document.getElementById('graphicsContainer');
        $sidebarContainer = document.getElementById('sidebarContainer');
        $sidebarControlsContainer = document.getElementById('sidebarControlsContainer');
        $mainContainer = document.getElementById('mainContainer');
        adjustLayout();
         
        window.addEventListener('resize', adjustLayoutOnResize, false);
    }

    return {
        initialLayout: initialLayout,
        getGraphicsViewportSize: getGraphicsViewportSize
    };

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

// Handle popup windows
var wpd = wpd || {};
wpd.popup = (function () {

    var dragInfo = null,
        $activeWindow = null;

    function show(popupid) {

        // Dim lights to make it obvious that these are modal dialog boxes.
        var shadowDiv = document.getElementById('shadow');
        shadowDiv.style.visibility = "visible";
        
        // Display the popup
        var pWindow = document.getElementById(popupid);
        var screenWidth = parseInt(window.innerWidth, 10);
        var screenHeight = parseInt(window.innerHeight, 10);
        var pWidth = parseInt(pWindow.offsetWidth, 10);
        var pHeight = parseInt(pWindow.offsetHeight, 10);
        var xPos = (screenWidth - pWidth)/2;
        var yPos = (screenHeight - pHeight)/2;
        yPos = yPos > 60 ? 60 : yPos;
        pWindow.style.left = xPos + 'px';
        pWindow.style.top = yPos + 'px';
        pWindow.style.visibility = "visible";

        // Attach drag events to the header
        for(var i = 0; i < pWindow.childNodes.length; i++) {
            if(pWindow.childNodes[i].className === 'popupheading') {
                pWindow.childNodes[i].addEventListener("mousedown", startDragging, false);
                break;
            }
        }

        $activeWindow = pWindow;
    }

    function close(popupid) {

        var shadowDiv = document.getElementById('shadow');
        shadowDiv.style.visibility = "hidden";

        var pWindow = document.getElementById(popupid);
        pWindow.style.visibility = "hidden";

        removeDragMask();
        $activeWindow = null;
    }

    function startDragging(ev) {
        // Create a drag mask that will react to mouse action after this point
        var $dragMask = document.createElement('div');
        $dragMask.className = 'popup-drag-mask';
        $dragMask.style.display = 'inline-block';
        $dragMask.addEventListener('mousemove', dragMouseMove, false);
        $dragMask.addEventListener('mouseup', dragMouseUp, false);
        $dragMask.addEventListener('mouseout', dragMouseOut, false);
        document.body.appendChild($dragMask);

        dragInfo = {
            dragMaskDiv: $dragMask,
            initialMouseX: ev.pageX,
            initialMouseY: ev.pageY,
            initialWindowX: $activeWindow.offsetLeft,
            initialWindowY: $activeWindow.offsetTop
        };

        ev.preventDefault();
        ev.stopPropagation();
    }

    function dragMouseMove(ev) {
        moveWindow(ev);
        ev.stopPropagation();
        ev.preventDefault();
    }

    function dragMouseUp(ev) {
        moveWindow(ev);
        removeDragMask(); 
        ev.stopPropagation();
        ev.preventDefault();
    }

    function moveWindow(ev) {
        var newWindowX = (dragInfo.initialWindowX + ev.pageX - dragInfo.initialMouseX),
            newWindowY = (dragInfo.initialWindowY + ev.pageY - dragInfo.initialMouseY),
            appWidth =  parseInt(document.body.offsetWidth, 10),
            appHeight =  parseInt(document.body.offsetHeight, 10),
            windowWidth = parseInt($activeWindow.offsetWidth, 10),
            windowHeight = parseInt($activeWindow.offsetHeight, 10);

        // move only up to a reasonable bound:
        if(newWindowX + 0.7*windowWidth < appWidth && newWindowX > 0 && newWindowY > 0
            && newWindowY + 0.5*windowHeight < appHeight) {
            $activeWindow.style.top = newWindowY + 'px';
            $activeWindow.style.left = newWindowX + 'px';
        }
    }

    function dragMouseOut(ev) {
        removeDragMask();
    }

    function removeDragMask() {
        if(dragInfo != null && dragInfo.dragMaskDiv != null) {
            dragInfo.dragMaskDiv.removeEventListener('mouseout', dragMouseOut, false);
            dragInfo.dragMaskDiv.removeEventListener('mouseup', dragMouseUp, false);
            dragInfo.dragMaskDiv.removeEventListener('mousemove', dragMouseMove, false);
            dragInfo.dragMaskDiv.style.display = 'none';
            document.body.removeChild(dragInfo.dragMaskDiv);
            dragInfo = null;
        }
    }

    return {
        show: show,
        close: close
    };

})();

wpd.busyNote = (function () {
    var noteDiv, isVisible = false;
    
    function show() {
        if(isVisible) {
            return;
        }
        if(noteDiv == null) {
            noteDiv = document.createElement('div');
            noteDiv.id = 'wait';
            noteDiv.innerHTML = '<p align="center">' + wpd.gettext('processing') + '...</p>';
        }
        document.body.appendChild(noteDiv);
        isVisible = true;
    }

    function close() {
        if (noteDiv != null && isVisible === true) {
            document.body.removeChild(noteDiv);
            isVisible = false;
        }
    }

    return {
        show: show,
        close: close
    };
})();

wpd.messagePopup = (function () {
    var close_callback;

    function show(title, msg, callback) {
        wpd.popup.show('messagePopup');
        document.getElementById('message-popup-heading').innerHTML = title;
        document.getElementById('message-popup-text').innerHTML = msg;
        close_callback = callback;
    }

    function close() {
        wpd.popup.close('messagePopup');
        if(close_callback != null) {
            close_callback();
        }
    }

    return {
        show: show,
        close: close
    };
})();

wpd.okCancelPopup = (function () {
    var okCallback, cancelCallback;

    function show(title, msg, ok_callback, cancel_callback) {
        wpd.popup.show('okCancelPopup');
        document.getElementById('ok-cancel-popup-heading').innerHTML = title;
        document.getElementById('ok-cancel-popup-text').innerHTML = msg;
        okCallback = ok_callback;
        cancelCallback = cancel_callback;
    }

    function ok() {
        wpd.popup.close('okCancelPopup');
        okCallback();
    }

    function cancel() {
        wpd.popup.close('okCancelPopup');
        cancelCallback();
    }

    return {
        show: show,
        ok: ok,
        cancel: cancel
    };
})();

wpd.unsupported = function () {
    wpd.messagePopup.show(wpd.gettext('unsupported'), wpd.gettext('unsupported-text'));
};

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};
wpd.sidebar = (function () {

    function show(sbid) { // Shows a specific sidebar
        clear();
        var sb = document.getElementById(sbid);
        sb.style.display = "inline-block";
        sb.style.height = parseInt(document.body.offsetHeight,10) - 280 + 'px';
    }

    function clear() { // Clears all open sidebars
        var sidebarList = document.getElementsByClassName('sidebar'),
            ii;

        for (ii = 0; ii < sidebarList.length; ii++) {
            sidebarList[ii].style.display="none";

        }
    }

    function resize() {
        var sidebarList = document.getElementsByClassName('sidebar'),
            ii;

        for (ii = 0; ii < sidebarList.length; ii++) {
            if (sidebarList[ii].style.display === "inline-block") {
                sidebarList[ii].style.height = parseInt(document.body.offsetHeight,10) - 280 + 'px';
            }
        }
    }

    return {
        show: show,
        clear: clear,
        resize: resize
    };

})();


/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/
var wpd = wpd || {};
wpd.toolbar = (function () {

    function show(tbid) { // Shows a specific toolbar
        clear();
        var tb = document.getElementById(tbid);
        tb.style.visibility = "visible";
    }

    function clear() { // Clears all open toolbars
        var toolbarList = document.getElementsByClassName('toolbar'),
            ii;

        for (ii = 0; ii < toolbarList.length; ii++) {
             toolbarList[ii].style.visibility="hidden";
        }        
    }

    return {
        show: show,
        clear: clear
    };
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.transformationEquations = (function () {
    function show() {
        if(wpd.appData.isAligned() === false) {
            wpd.messagePopup.show(wpd.gettext('transformation-eqns'), wpd.gettext('transformation-eqns-text'));
            return;
        }
        wpd.popup.show('axes-transformation-equations-window');
        var $list = document.getElementById('axes-transformation-equation-list'),
            listHTML = '',
            axes = wpd.appData.getPlotData().axes,
            eqns = axes.getTransformationEquations(),
            i,
            axesType;

        listHTML += '<p><b>Axes Type</b>: ';
        if(axes instanceof wpd.XYAxes) {
            listHTML += 'XY</p>';
        } else if(axes instanceof wpd.PolarAxes) {
            listHTML += 'Polar</p>';
        } else if(axes instanceof wpd.TernaryAxes) {
            listHTML += 'Ternary</p>';
        } else if(axes instanceof wpd.MapAxes) {
            listHTML += 'Map</p>';
        } else if(axes instanceof wpd.ImageAxes) {
            listHTML += 'Image</p>';
        }

        if(eqns.pixelToData != null) {
            listHTML += '<p><b>Pixel to Data</b></p><ol>';
            for(i = 0; i < eqns.pixelToData.length; i++) {
                listHTML += '<li><p class="footnote">'+eqns.pixelToData[i]+"</p></li>";
            }
            listHTML += '</ol>';
        }
        
        listHTML += '<p>&nbsp;</p>';

        if(eqns.dataToPixel != null) {
            listHTML += '<p><b>Data to Pixel</b></p><ol>';
            for(i = 0; i < eqns.dataToPixel.length; i++) {
                listHTML += '<li><p class="footnote">'+eqns.dataToPixel[i]+"</p></li>";
            }
            listHTML += '</ol>';
        }
        
        $list.innerHTML = listHTML;
    }
    return {
        show: show
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.webcamCapture = (function () {

    var cameraStream;

    function isSupported() {
        return !(getUserMedia() == null);
    }

    function unsupportedBrowser() {
        wpd.messagePopup.show(wpd.gettext('webcam-capture'), wpd.gettext('webcam-capture-text'));
    }

    function getUserMedia() {
        return navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    function start() {
        if(!isSupported()) {
            unsupportedBrowser();
            return;
        }
        wpd.popup.show('webcamCapture'); 
        var $camVideo = document.getElementById('webcamVideo');
        navigator.getUserMedia = getUserMedia();
        navigator.getUserMedia({video: true}, function(stream) {
            cameraStream = stream;
            $camVideo.src = window.URL.createObjectURL(stream);
  		}, function() {}); 
    }

    function capture() {
        var $webcamCanvas = document.createElement('canvas'),
            $camVideo = document.getElementById('webcamVideo'),
            webcamCtx = $webcamCanvas.getContext('2d'),
            imageData;
        $webcamCanvas.width = $camVideo.videoWidth;
        $webcamCanvas.height = $camVideo.videoHeight;
        webcamCtx.drawImage($camVideo, 0, 0);
        imageData = webcamCtx.getImageData(0, 0, $webcamCanvas.width, $webcamCanvas.height);
        cameraOff();
        wpd.graphicsWidget.runImageOp(function() {
            return {
                imageData: imageData,
                width: $webcamCanvas.width,
                height: $webcamCanvas.height
            };
        });
    }

    function cameraOff() {
        if(cameraStream != undefined) {
            cameraStream.stop();
        }
        wpd.popup.close('webcamCapture'); 
    }

    function cancel() {
        cameraOff();
    }

    return {
        start: start,
        cancel: cancel,
        capture: capture
    };

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.

*/

/* Zoomed-in view */
var wpd = wpd || {};
wpd.zoomView = (function() {
    var zCanvas, 
        zctx,
        tempCanvas,
        tctx,
        zWindowWidth = 250,
        zWindowHeight = 250,
        $mPosn,
        extendedCrosshair = false,
        pix = [],
        zoomTimeout,
        zoomRatio,
        crosshairColorText = 'black';

    pix[0] = [];

    function init() {

        zCanvas = document.getElementById('zoomCanvas');
    	zctx = zCanvas.getContext('2d');
	    tempCanvas = document.createElement('canvas');
        tctx = tempCanvas.getContext('2d');

        $mPosn = document.getElementById('mousePosition');

        zoomRatio = 5;

        drawCrosshair();
    }

    function drawCrosshair() {
        var zCrossHair = document.getElementById("zoomCrossHair");
        var zchCtx = zCrossHair.getContext("2d");
        
        zCrossHair.width = zCrossHair.width;

        if(crosshairColorText === 'black') {
            zchCtx.strokeStyle = "rgba(0,0,0,1)";
        } else if(crosshairColorText === 'red') {
            zchCtx.strokeStyle = "rgba(255,0,0,1)";
        } else if(crosshairColorText === 'yellow') {
            zchCtx.strokeStyle = "rgba(255,255,0,1)";
        } else {
            zchCtx.strokeStyle = "rgba(0,0,0,1)";
        }

        zchCtx.beginPath();
        zchCtx.moveTo(zWindowWidth/2, 0);
        zchCtx.lineTo(zWindowWidth/2, zWindowHeight);
        zchCtx.moveTo(0, zWindowHeight/2);
        zchCtx.lineTo(zWindowWidth, zWindowHeight/2);
        zchCtx.stroke();
    }
 
    function setZoomRatio(zratio) {
        zoomRatio = zratio;
    }

    function getZoomRatio() {
        return zoomRatio;
    }

    function getSize() {
         return {
            width: zWindowWidth,
            height: zWindowHeight
        };

    }

    function setZoomImage(imgData, x0, y0, zwidth, zheight) {
        tempCanvas.width = zwidth/zoomRatio;
        tempCanvas.height = zheight/zoomRatio;
        tctx.putImageData(imgData, 0, 0);
        zCanvas.width = zCanvas.width;
        zctx.drawImage(tempCanvas, x0, y0, zwidth, zheight);
    }

    function setCoords(imageX, imageY) {
        if(wpd.appData.isAligned()) {
            var plotData = wpd.appData.getPlotData();
            $mPosn.innerHTML = plotData.axes.pixelToLiveString(imageX, imageY);
        } else {
            $mPosn.innerHTML = imageX.toFixed(2) + ', ' + imageY.toFixed(2);
        }
    }

    function showSettingsWindow() {
        document.getElementById('zoom-magnification-value').value = zoomRatio;
        document.getElementById('zoom-crosshair-color-value').value = crosshairColorText;
        wpd.popup.show('zoom-settings-popup');
    }

    function applySettings() {
        zoomRatio = document.getElementById('zoom-magnification-value').value;
        crosshairColorText = document.getElementById('zoom-crosshair-color-value').value;
        drawCrosshair();
        wpd.popup.close('zoom-settings-popup');
    }

    return {
        initZoom: init,
        setZoomImage: setZoomImage,
        setCoords: setCoords,
        setZoomRatio: setZoomRatio,
        getZoomRatio: getZoomRatio,
        getSize: getSize,
        showSettingsWindow: showSettingsWindow,
        applySettings: applySettings
    };
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.xyCalibration = (function () {

    function start() {
        wpd.popup.show('xyAxesInfo');
    }

    function reload() {
        var tool = new wpd.AxesCornersTool(4, 2, ['X1', 'X2', 'Y1', 'Y2'], true);
        wpd.graphicsWidget.setTool(tool);
    }

    function pickCorners() {
        wpd.popup.close('xyAxesInfo');
        var tool = new wpd.AxesCornersTool(4, 2, ['X1', 'X2', 'Y1', 'Y2']);
        wpd.graphicsWidget.setTool(tool);
    }

    function getCornerValues() {
        wpd.popup.show('xyAlignment');
    }

    function align() {
        var xmin = document.getElementById('xmin').value,
	        xmax = document.getElementById('xmax').value,
	        ymin = document.getElementById('ymin').value,
	        ymax = document.getElementById('ymax').value,
	        xlog = document.getElementById('xlog').checked,
	        ylog = document.getElementById('ylog').checked,
            axes = new wpd.XYAxes(),
            plot,
            calib = wpd.alignAxes.getActiveCalib();

        // validate log scale values
        if((xlog && (parseFloat(xmin) == 0 || parseFloat(xmax) == 0)) || (ylog && (parseFloat(ymin) == 0 || parseFloat(ymax) == 0))) {
            wpd.popup.close('xyAlignment');
            wpd.messagePopup.show(wpd.gettext('calibration-invalid-log-inputs'), wpd.gettext('calibration-enter-valid-log'), getCornerValues);
            return false;            
        }

        calib.setDataAt(0, xmin, ymin);
        calib.setDataAt(1, xmax, ymin);
        calib.setDataAt(2, xmin, ymin);
        calib.setDataAt(3, xmax, ymax);
        if(!axes.calibrate(calib, xlog, ylog)) {
            wpd.popup.close('xyAlignment');
            wpd.messagePopup.show(wpd.gettext('calibration-invalid-inputs'), wpd.gettext('calibration-enter-valid'), getCornerValues);
            return false;
        }
        plot = wpd.appData.getPlotData();
        plot.axes = axes;
        plot.calibration = calib;
        wpd.popup.close('xyAlignment');
        return true;
    }

    return {
        start: start,
        reload: reload,
        pickCorners: pickCorners,
        getCornerValues: getCornerValues,
        align: align
    };
})();

wpd.barCalibration = (function () {

    function start() {
        wpd.popup.show('barAxesInfo');
    }

    function reload() {
        var tool = new wpd.AxesCornersTool(2, 2, ['P1', 'P2'], true);
        wpd.graphicsWidget.setTool(tool);
    }

    function pickCorners() {
        wpd.popup.close('barAxesInfo');
        var tool = new wpd.AxesCornersTool(2, 2, ['P1', 'P2']);
        wpd.graphicsWidget.setTool(tool);
    }

    function getCornerValues() {
        wpd.popup.show('barAlignment');
    }

    function align() {
        var p1 = document.getElementById('bar-axes-p1').value,
	        p2 = document.getElementById('bar-axes-p2').value,
	        isLogScale = document.getElementById('bar-axes-log-scale').checked,
            isRotated = document.getElementById('bar-axes-rotated').checked,
            axes = new wpd.BarAxes(),
            plot,
            calib = wpd.alignAxes.getActiveCalib();

        calib.setDataAt(0, 0, p1);
        calib.setDataAt(1, 0, p2);
        if(!axes.calibrate(calib, isLogScale, isRotated)) {
            wpd.popup.close('barAlignment');
            wpd.messagePopup.show(wpd.gettext('calibration-invalid-inputs'), wpd.gettext('calibration-enter-valid'), getCornerValues);
            return false;
        }
        plot = wpd.appData.getPlotData();
        plot.axes = axes;
        plot.calibration = calib;
        wpd.popup.close('barAlignment');
        return true;
    }

    return {
        start: start,
        reload: reload,
        pickCorners: pickCorners,
        getCornerValues: getCornerValues,
        align: align
    };
})();


wpd.polarCalibration = (function () {

    function start() {
        wpd.popup.show('polarAxesInfo');
    }

    function reload() {
        var tool = new wpd.AxesCornersTool(3, 2, ['Origin', 'P1', 'P2'], true);
        wpd.graphicsWidget.setTool(tool);
    }

    function pickCorners() {
        wpd.popup.close('polarAxesInfo');
        var tool = new wpd.AxesCornersTool(3, 2, ['Origin', 'P1', 'P2']);
        wpd.graphicsWidget.setTool(tool);
    }

    function getCornerValues() {
        wpd.popup.show('polarAlignment');
    }

    function align() {
        var r1 = parseFloat(document.getElementById('polar-r1').value),
	        theta1 = parseFloat(document.getElementById('polar-theta1').value),
	        r2 = parseFloat(document.getElementById('polar-r2').value),
	        theta2 = parseFloat(document.getElementById('polar-theta2').value),
	        degrees = document.getElementById('polar-degrees').checked,
	        radians = document.getElementById('polar-radians').checked,
	        orientation = document.getElementById('polar-clockwise').checked,
            rlog = document.getElementById('polar-log-scale').checked,
            axes = new wpd.PolarAxes(),
            plot,
            isDegrees = degrees,
            calib = wpd.alignAxes.getActiveCalib();

        calib.setDataAt(1, r1, theta1);
        calib.setDataAt(2, r2, theta2);
        axes.calibrate(calib, isDegrees, orientation, rlog);

        plot = wpd.appData.getPlotData();
        plot.axes = axes;
        plot.calibration = calib;
        wpd.popup.close('polarAlignment');
        return true;
    }

    return {
        start: start,
        reload: reload,
        pickCorners: pickCorners,
        getCornerValues: getCornerValues,
        align: align
    };

})();

wpd.ternaryCalibration = (function () {

    function start() {
        wpd.popup.show('ternaryAxesInfo');
    }

    function reload() {
        var tool = new wpd.AxesCornersTool(3, 3, ['A', 'B', 'C'], true);
        wpd.graphicsWidget.setTool(tool);
    }

    function pickCorners() {
        wpd.popup.close('ternaryAxesInfo');
        var tool = new wpd.AxesCornersTool(3, 3, ['A', 'B', 'C']);
        wpd.graphicsWidget.setTool(tool);
    }

    function getCornerValues() {
        wpd.popup.show('ternaryAlignment');
    }

    function align() {
        var range1 = document.getElementById('range0to1').checked,
	        range100 = document.getElementById('range0to100').checked,
	        ternaryNormal = document.getElementById('ternarynormal').checked,
            axes = new wpd.TernaryAxes(),
            plot,
            calib = wpd.alignAxes.getActiveCalib();

        axes.calibrate(calib, range100, ternaryNormal);
        plot = wpd.appData.getPlotData();
        plot.axes = axes;
        plot.calibration = calib;
        wpd.popup.close('ternaryAlignment');
        return true;
    }

    return {
        start: start,
        reload: reload,
        pickCorners: pickCorners,
        getCornerValues: getCornerValues,
        align: align
    };

})();

wpd.mapCalibration = (function () {

    function start() {
        wpd.popup.show('mapAxesInfo');
    }

    function reload() {
        var tool = new wpd.AxesCornersTool(2, 2, ['P1', 'P2'],true);
        wpd.graphicsWidget.setTool(tool);
    }

    function pickCorners() {
        wpd.popup.close('mapAxesInfo');
        var tool = new wpd.AxesCornersTool(2, 2, ['P1', 'P2']);
        wpd.graphicsWidget.setTool(tool);
    }

    function getCornerValues() {
        wpd.popup.show('mapAlignment');
    }

    function align() {
        var scaleLength = parseFloat(document.getElementById('scaleLength').value),
            scaleUnits = document.getElementById('scaleUnits').value,
            axes = new wpd.MapAxes(),
            plot,
            calib = wpd.alignAxes.getActiveCalib();

        axes.calibrate(calib, scaleLength, scaleUnits);
        plot = wpd.appData.getPlotData();
        plot.axes = axes;
        plot.calibration = calib;
        wpd.popup.close('mapAlignment');
        return true;
    }

    return {
        start: start,
        reload: reload,
        pickCorners: pickCorners,
        getCornerValues: getCornerValues,
        align: align
    };

})();


wpd.AxesCornersTool = (function () {

    var Tool = function(maxPoints, dimensions, pointLabels, reloadTool) {
        var pointCount = 0,
            ncal = new wpd.Calibration(dimensions),
            isCapturingCorners = true; 

        if(reloadTool) {
            pointCount = maxPoints;
            ncal = wpd.alignAxes.getActiveCalib();
            isCapturingCorners = false;
        } else {
            pointCount = 0;
            ncal = new wpd.Calibration(dimensions);
            isCapturingCorners = true;
            ncal.labels = pointLabels;
            wpd.alignAxes.setActiveCalib(ncal);
            wpd.graphicsWidget.resetData();
        }

        this.onMouseClick = function(ev, pos, imagePos) {

            if(isCapturingCorners) {
                pointCount = pointCount + 1;
                
                var calib =  wpd.alignAxes.getActiveCalib();
                calib.addPoint(imagePos.x, imagePos.y, 0, 0);
                calib.unselectAll();
                calib.selectPoint(pointCount-1);
                wpd.graphicsWidget.forceHandlerRepaint(); 

                if(pointCount === maxPoints) {
                    isCapturingCorners = false;
                    wpd.alignAxes.calibrationCompleted();
                }

                wpd.graphicsWidget.updateZoomOnEvent(ev);
            } else {
                var cal = wpd.alignAxes.getActiveCalib();
                cal.unselectAll();
                //cal.selectNearestPoint(imagePos.x, imagePos.y, 15.0/wpd.graphicsWidget.getZoomRatio());
                cal.selectNearestPoint(imagePos.x, imagePos.y);
                wpd.graphicsWidget.forceHandlerRepaint();
                wpd.graphicsWidget.updateZoomOnEvent(ev);

            }
        };

        this.onKeyDown = function(ev) {
            var cal = wpd.alignAxes.getActiveCalib();

            if(cal.getSelectedPoints().length === 0) {
                return;
            }

            var selPoint = cal.getPoint(cal.getSelectedPoints()[0]),
                pointPx = selPoint.px,
                pointPy = selPoint.py,
                stepSize = ev.shiftKey === true ? 5/wpd.graphicsWidget.getZoomRatio() : 0.5/wpd.graphicsWidget.getZoomRatio();

            if(wpd.keyCodes.isUp(ev.keyCode)) {
                pointPy = pointPy - stepSize;
            } else if(wpd.keyCodes.isDown(ev.keyCode)) {
                pointPy = pointPy + stepSize;
            } else if(wpd.keyCodes.isLeft(ev.keyCode)) {
                pointPx = pointPx - stepSize;
            } else if(wpd.keyCodes.isRight(ev.keyCode)) {
                pointPx = pointPx + stepSize;
            } else {
                return;
            }
            
            cal.changePointPx(cal.getSelectedPoints()[0], pointPx, pointPy);
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomToImagePosn(pointPx, pointPy);
            ev.preventDefault();
            ev.stopPropagation();
        };

    };

    return Tool;
})();


wpd.AlignmentCornersRepainter = (function () {
    var Tool = function () {

        this.painterName = 'AlignmentCornersReptainer';

        this.onForcedRedraw = function () {
            wpd.graphicsWidget.resetData();
            this.onRedraw();
        };

        this.onRedraw = function () {
            var cal = wpd.alignAxes.getActiveCalib();
            if (cal == null) { return; }

            var i, imagePos, imagePx, fillStyle;

            for(i = 0; i < cal.getCount(); i++) {
                imagePos = cal.getPoint(i);
                imagePx = { x: imagePos.px, y: imagePos.py };

                if(cal.isPointSelected(i)) {
                    fillStyle = "rgba(0,200,0,1)";
                } else {
        		    fillStyle = "rgba(200,0,0,1)";
                }

                wpd.graphicsHelper.drawPoint(imagePx, fillStyle, cal.labels[i]);
            }
        };
    };
    return Tool;
})();

wpd.alignAxes = (function () {

    var calib, calibrator;

    function initiatePlotAlignment() {
        xyEl = document.getElementById('r_xy');
        polarEl = document.getElementById('r_polar');
        ternaryEl = document.getElementById('r_ternary');
        mapEl = document.getElementById('r_map');
        imageEl = document.getElementById('r_image');
        barEl = document.getElementById('r_bar');

        wpd.popup.close('axesList');

        if (xyEl.checked === true) {
            calibrator = wpd.xyCalibration;
        } else if(barEl.checked === true) {
            calibrator = wpd.barCalibration;
        } else if(polarEl.checked === true) {
            calibrator = wpd.polarCalibration;
        } else if(ternaryEl.checked === true) {
            calibrator = wpd.ternaryCalibration;
        } else if(mapEl.checked === true) {
            calibrator = wpd.mapCalibration;
        } else if(imageEl.checked === true) {
            calibrator = null;
            var imageAxes = new wpd.ImageAxes();
            imageAxes.calibrate();
            wpd.appData.getPlotData().axes = imageAxes;
            wpd.appData.isAligned(true);
            wpd.acquireData.load();
        }

        if(calibrator != null) {
            calibrator.start();
            wpd.graphicsWidget.setRepainter(new wpd.AlignmentCornersRepainter());
        }
    }

    function calibrationCompleted() {
        wpd.sidebar.show('axes-calibration-sidebar');
    }


    function getCornerValues() {
        calibrator.getCornerValues();
    }

    function align() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();
        if(!calibrator.align()) {
            return;
        }
        wpd.appData.isAligned(true);
        wpd.acquireData.load();
    }

    function getActiveCalib() {
        return calib;
    }

    function setActiveCalib(cal) {
        calib = cal;
    }

    function editAlignment() {
        var hasAlignment = wpd.appData.isAligned() && calibrator != null;
        if(hasAlignment) {
            wpd.popup.show('edit-or-reset-calibration-popup');
        } else {
            wpd.popup.show('axesList');
        }
    }

    function reloadCalibrationForEditing() {
        wpd.popup.close('edit-or-reset-calibration-popup');        
        calibrator.reload();
        wpd.graphicsWidget.setRepainter(new wpd.AlignmentCornersRepainter());
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.sidebar.show('axes-calibration-sidebar');
    }

    return {
        start: initiatePlotAlignment,
        calibrationCompleted: calibrationCompleted,
        getCornerValues: getCornerValues,
        align: align,
        getActiveCalib: getActiveCalib,
        setActiveCalib: setActiveCalib,
        editAlignment: editAlignment,
        reloadCalibrationForEditing: reloadCalibrationForEditing
    };

})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/
var wpd = wpd || {};
wpd.autoExtraction = (function () {

    function start() {
        wpd.sidebar.show('auto-extraction-sidebar');
        updateDatasetControl();
        wpd.colorPicker.init();
        wpd.algoManager.updateAlgoList();
    }

    function updateDatasetControl() {
        var plotData = wpd.appData.getPlotData(),
            currentDataset = plotData.getActiveDataSeries(), // just to create a dataset if there is none.
            currentIndex = plotData.getActiveDataSeriesIndex(),
            $datasetList = document.getElementById('automatic-sidebar-dataset-list'),
            listHTML = '',
            i;
        for(i = 0; i < plotData.dataSeriesColl.length; i++) {
            listHTML += '<option>'+plotData.dataSeriesColl[i].name+'</option>';
        }
        $datasetList.innerHTML = listHTML;
        $datasetList.selectedIndex = currentIndex;
    }

    function changeDataset() {
        var $datasetList = document.getElementById('automatic-sidebar-dataset-list'),
            index = $datasetList.selectedIndex;
        wpd.appData.getPlotData().setActiveDataSeriesIndex(index);
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.dataPointCounter.setCount();
    }
          
    return {
        start: start,
        updateDatasetControl: updateDatasetControl,
        changeDataset: changeDataset
    };
})();


// Manage auto extract algorithms
wpd.algoManager = (function() {

    var axesPtr;

    function updateAlgoList() {
        
        var innerHTML = '',
            axes = wpd.appData.getPlotData().axes,
            $algoOptions = document.getElementById('auto-extract-algo-name');

        if(axes === axesPtr) {
            return; // don't re-render if already done for this axes object.
        } else {
            axesPtr = axes;
        }

        // Averaging Window
        if(!(axes instanceof wpd.BarAxes)) {
            innerHTML += '<option value="averagingWindow">' + wpd.gettext('averaging-window') + '</option>';
        }

        // X Step w/ Interpolation and X Step
        if(axes instanceof wpd.XYAxes) {
            innerHTML += '<option value="XStepWithInterpolation">' + wpd.gettext('x-step-with-interpolation') + '</option>';
            innerHTML += '<option value="XStep">' + wpd.gettext('x-step') + '</option>';
        }

        // Blob Detector
        if(!(axes instanceof wpd.BarAxes)) {
            innerHTML += '<option value="blobDetector">' + wpd.gettext('blob-detector') + '</option>';
        }

        // Bar Extraction
        if(axes instanceof wpd.BarAxes) {
            innerHTML += '<option value="barExtraction">' + wpd.gettext('bar-extraction') + '</option>';
        }

        // Histogram
        if(axes instanceof wpd.XYAxes) {
            innerHTML += '<option value="histogram">' + wpd.gettext('histogram') + '</option>';
        }

        $algoOptions.innerHTML = innerHTML;

        applyAlgoSelection();
    }

    function applyAlgoSelection() {
        var $algoOptions = document.getElementById('auto-extract-algo-name'),
            selectedValue = $algoOptions.value,
            autoDetector = wpd.appData.getPlotData().getAutoDetector();

        if (selectedValue === 'averagingWindow') {
            autoDetector.algorithm = new wpd.AveragingWindowAlgo();
        } else if (selectedValue === 'XStepWithInterpolation') {
            autoDetector.algorithm = new wpd.XStepWithInterpolationAlgo();
        } else if (selectedValue === 'XStep') {
            autoDetector.algorithm = new wpd.AveragingWindowWithStepSizeAlgo();
        } else if (selectedValue === 'blobDetector') {
            autoDetector.algorithm = new wpd.BlobDetectorAlgo();
        } else if (selectedValue === 'barExtraction' || selectedValue === 'histogram') {
            autoDetector.algorithm = new wpd.BarExtractionAlgo();
        } else {
            autoDetector.algorithm = new wpd.AveragingWindowAlgo();
        }

        renderParameters(autoDetector.algorithm);
    }

    function renderParameters(algo) {
        var $paramContainer = document.getElementById('algo-parameter-container'),
            algoParams = algo.getParamList(),
            pi,
            tableString = "<table>";

        
        for(pi = 0; pi < algoParams.length; pi++) {
            tableString += '<tr><td>' + algoParams[pi][0] + 
                '</td><td><input type="text" size=3 id="algo-param-' + pi + 
                '" class="algo-params" value="'+ algoParams[pi][2] + '"/></td><td>' 
                + algoParams[pi][1] + '</td></tr>';
        }

        tableString += "</table>";
        $paramContainer.innerHTML = tableString;
    }

    function run() {
        wpd.busyNote.show();
        var fn = function () {
            var autoDetector = wpd.appData.getPlotData().getAutoDetector(),
                algo = autoDetector.algorithm,
                repainter = new wpd.DataPointsRepainter(),
                $paramFields = document.getElementsByClassName('algo-params'),
                pi,
                paramId, paramIndex,
                ctx = wpd.graphicsWidget.getAllContexts(),
                imageSize = wpd.graphicsWidget.getImageSize();

            for(pi = 0; pi < $paramFields.length; pi++) {
                paramId = $paramFields[pi].id;
                paramIndex = parseInt(paramId.replace('algo-param-', ''), 10);
                algo.setParam(paramIndex, parseFloat($paramFields[pi].value));
            }

            wpd.graphicsWidget.removeTool();

            autoDetector.imageData = ctx.oriImageCtx.getImageData(0, 0, imageSize.width, imageSize.height);
            autoDetector.generateBinaryData();
            wpd.graphicsWidget.setRepainter(repainter);
            algo.run(wpd.appData.getPlotData());
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.dataPointCounter.setCount();
            wpd.busyNote.close();
            return true;
        };
        setTimeout(fn, 10); // This is required for the busy note to work!
    }

    return {
        updateAlgoList: updateAlgoList,
        applyAlgoSelection: applyAlgoSelection,
        run: run
    };
})();


/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.colorSelectionWidget = (function () {

    var color,
        triggerElementId,
        title,
        setColorDelegate;
    
    function setParams(params) {
        color = params.color;
        triggerElementId = params.triggerElementId;
        title = params.title;
        setColorDelegate = params.setColorDelegate;

        var $widgetTitle = document.getElementById('color-selection-title');
        $widgetTitle.innerHTML = title;
    }

    function apply() {
        var $triggerBtn = document.getElementById(triggerElementId);
        $triggerBtn.style.backgroundColor = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
        if(color[0] + color[1] + color[2] < 200) {
            $triggerBtn.style.color = 'rgb(255,255,255)';
        } else {
            $triggerBtn.style.color = 'rgb(0,0,0)';
        }
    }

    function startPicker() {
        var $selectedColor = document.getElementById('color-selection-selected-color-box');
        
        $selectedColor.style.backgroundColor = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
        document.getElementById('color-selection-red').value = color[0];
        document.getElementById('color-selection-green').value = color[1];
        document.getElementById('color-selection-blue').value = color[2];
        renderColorOptions();
        wpd.popup.show('color-selection-widget');
    }

    function renderColorOptions() {
        var $container = document.getElementById('color-selection-options'),
            topColors = wpd.appData.getPlotData().topColors,
            colorCount = topColors.length > 10 ? 10 : topColors.length,
            colori,
            containerHtml = "",
            perc,
            colorString;

        for (colori = 0; colori < colorCount; colori++) {            
            colorString = 'rgb(' + topColors[colori].r + ',' + topColors[colori].g + ',' + topColors[colori].b + ');';
            perc = topColors[colori].percentage.toFixed(3) + "%";
            containerHtml += '<div class="colorOptionBox" style="background-color: ' + colorString + '\" title=\"' + perc +  '" onclick="wpd.colorSelectionWidget.selectTopColor('+ colori +');"></div>';
        }

        $container.innerHTML = containerHtml;
    }

    function pickColor() {
        wpd.popup.close('color-selection-widget');
        var tool = new wpd.ColorPickerTool();
        tool.onComplete = function (col) {
            color = col;
            setColorDelegate(col);
            wpd.graphicsWidget.removeTool();
            startPicker();
        };
        wpd.graphicsWidget.setTool(tool);
    }

    function setColor() {
        var gui_color = [];
        gui_color[0] = parseInt(document.getElementById('color-selection-red').value, 10);
        gui_color[1] = parseInt(document.getElementById('color-selection-green').value, 10);
        gui_color[2] = parseInt(document.getElementById('color-selection-blue').value, 10);
        color = gui_color;
        setColorDelegate(gui_color);
        wpd.popup.close('color-selection-widget');
        apply();
    }

    function selectTopColor(colorIndex) {
        var gui_color = [],
            topColors = wpd.appData.getPlotData().topColors;

        gui_color[0] = topColors[colorIndex].r;
        gui_color[1] = topColors[colorIndex].g;
        gui_color[2] = topColors[colorIndex].b;

        color = gui_color;
        setColorDelegate(gui_color);
        startPicker();
    }

    function paintFilteredColor(binaryData, maskPixels) {
         var ctx = wpd.graphicsWidget.getAllContexts(),
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            imageSize = wpd.graphicsWidget.getImageSize(),
            maski,
            img_index,
            imgx, imgy,
            dataLayer;

        dataLayer = ctx.oriDataCtx.getImageData(0, 0, imageSize.width, imageSize.height);

        if(maskPixels == null || maskPixels.length === 0) {
            return;
        }

        for(maski = 0; maski < maskPixels.length; maski++) {
            img_index = maskPixels[maski];
            if(binaryData[img_index] === true) {
                imgx = img_index % imageSize.width;
                imgy = parseInt(img_index/imageSize.width, 10);
                dataLayer.data[img_index*4] = 255;
                dataLayer.data[img_index*4+1] = 255;
                dataLayer.data[img_index*4+2] = 0;
                dataLayer.data[img_index*4+3] = 255;                
            } else {
                dataLayer.data[img_index*4] = 0;
                dataLayer.data[img_index*4+1] = 0;
                dataLayer.data[img_index*4+2] = 0;
                dataLayer.data[img_index*4+3] = 150;   
            }
        }

        ctx.oriDataCtx.putImageData(dataLayer, 0, 0);
        wpd.graphicsWidget.copyImageDataLayerToScreen();
    }

    return {
        setParams: setParams,
        startPicker: startPicker,
        pickColor: pickColor,
        setColor: setColor,
        selectTopColor: selectTopColor,
        paintFilteredColor: paintFilteredColor
    };

})();

wpd.colorPicker = (function () {

    function getFGPickerParams() {
        return {
            color: wpd.appData.getPlotData().getAutoDetector().fgColor,
            triggerElementId: 'color-button',
            title: wpd.gettext('specify-foreground-color'),
            setColorDelegate: function(col) {
                wpd.appData.getPlotData().getAutoDetector().fgColor = col;
            }
        };
    }

    function getBGPickerParams() {
        return {
            color: wpd.appData.getPlotData().getAutoDetector().bgColor,
            triggerElementId: 'color-button',
            title: wpd.gettext('specify-background-color'),
            setColorDelegate: function(col) {
                wpd.appData.getPlotData().getAutoDetector().bgColor = col;
            }
        };
    }
    
    function init() {
        var $colorBtn = document.getElementById('color-button'),
            $colorDistance = document.getElementById('color-distance-value'),
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            $modeSelector = document.getElementById('color-detection-mode-select'),
            color;
        
        if(autoDetector.colorDetectionMode === 'fg') {
            color = autoDetector.fgColor;
        } else {
            color = autoDetector.bgColor;
        }
        color_distance = autoDetector.colorDistance;

        $colorBtn.style.backgroundColor = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
        $colorDistance.value = color_distance;
        $modeSelector.value = autoDetector.colorDetectionMode;
    }

    function changeColorDistance() {
        var color_distance = parseFloat(document.getElementById('color-distance-value').value);
        wpd.appData.getPlotData().getAutoDetector().colorDistance = color_distance;
    }

    function testColorDetection() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.resetData();
        wpd.graphicsWidget.setRepainter(new wpd.ColorFilterRepainter());

        var ctx = wpd.graphicsWidget.getAllContexts(),
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            imageSize = wpd.graphicsWidget.getImageSize();

        autoDetector.imageData = ctx.oriImageCtx.getImageData(0, 0, imageSize.width, imageSize.height);
        autoDetector.generateBinaryData();
        wpd.colorSelectionWidget.paintFilteredColor(autoDetector.binaryData, autoDetector.mask); 
    }
    
    function startPicker() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();
        if(wpd.appData.getPlotData().getAutoDetector().colorDetectionMode === 'fg') {
            wpd.colorSelectionWidget.setParams(getFGPickerParams());
        } else {
            wpd.colorSelectionWidget.setParams(getBGPickerParams());
        }
        wpd.colorSelectionWidget.startPicker();
    }

    function changeDetectionMode() {
        var $modeSelector = document.getElementById('color-detection-mode-select');
        wpd.appData.getPlotData().getAutoDetector().colorDetectionMode = $modeSelector.value;
        init();
    }

    return {
        startPicker: startPicker,
        changeDetectionMode: changeDetectionMode,
        changeColorDistance: changeColorDistance,
        init: init,
        testColorDetection: testColorDetection
    };
})();

wpd.ColorPickerTool = (function () {
    var Tool = function () {
        var ctx = wpd.graphicsWidget.getAllContexts();

        this.onMouseClick = function(ev, pos, imagePos) {
            var ir, ig, ib, ia, pixData;
            
            pixData = ctx.oriImageCtx.getImageData(imagePos.x, imagePos.y, 1, 1);
            ir = pixData.data[0];
            ig = pixData.data[1];
            ib = pixData.data[2];
            ia = pixData.data[3];
            if(ia === 0) { // for transparent color, assume white RGB
                ir = 255; ig = 255; ib = 255;
            }
            this.onComplete([ir, ig, ib]);
        };

        this.onComplete = function(col) {};
    };
    return Tool;
})();


wpd.ColorFilterRepainter = (function () {
    var Painter = function () {
        this.painterName = 'colorFilterRepainter';

        this.onRedraw = function () {
            var autoDetector = wpd.appData.getPlotData().getAutoDetector();
            wpd.colorSelectionWidget.paintFilteredColor(autoDetector.binaryData, autoDetector.mask);
        };
    };
    return Painter;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.plotDataProvider = (function() {

    function getDatasetNames() {
        var plotData = wpd.appData.getPlotData(),
            datasetNames = [],
            di;
        for(di = 0; di < plotData.dataSeriesColl.length; di++) {
            datasetNames[di] = plotData.dataSeriesColl[di].name;
        }
        return datasetNames;
    }

    function getDatasetIndex() {
        return wpd.appData.getPlotData().getActiveDataSeriesIndex();
    }

    function setDatasetIndex(index) {
        wpd.appData.getPlotData().setActiveDataSeriesIndex(index);
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.dataPointCounter.setCount();
    }

    function getData() {
        var axes = wpd.appData.getPlotData().axes;

        if(axes instanceof wpd.BarAxes) {
            return getBarAxesData();
        } else {
            return getGeneralAxesData();
        }
    }

    function getBarAxesData() {
        var fields = [],
            fieldDateFormat = [],
            rawData = [],
            isFieldSortable = [],
            plotData = wpd.appData.getPlotData(),
            dataSeries = plotData.getActiveDataSeries(),
            axes = plotData.axes,
            rowi, coli,
            dataPt,
            transformedDataPt,
            lab;

        for (rowi = 0; rowi < dataSeries.getCount(); rowi++) {
            
            dataPt = dataSeries.getPixel(rowi);
            transformedDataPt = axes.pixelToData(dataPt.x, dataPt.y);
            
            rawData[rowi] = [];
            
            // metaData[0] should be the label:
            if(dataPt.metadata == null) {
                lab = "Bar" + rowi;
            } else {
                lab = dataPt.metadata[0];
            }
            rawData[rowi][0] = lab;
            // transformed value
            rawData[rowi][1] = transformedDataPt[0];
            // other metadata if present can go here in the future.
        }

        fields = ['Label', 'Value'];
        isFieldSortable = [false, true];

        return {
            fields: fields,
            fieldDateFormat: fieldDateFormat,
            rawData: rawData,
            allowConnectivity: false,
            connectivityFieldIndices: [],
            isFieldSortable: isFieldSortable
        };
    }

    function getGeneralAxesData() {
        // 2D XY, Polar, Ternary, Image, Map

        var plotData = wpd.appData.getPlotData(),
            dataSeries = plotData.getActiveDataSeries(),
            axes = plotData.axes,
            fields = [],
            fieldDateFormat = [],
            connectivityFieldIndices = [],
            rawData = [],
            isFieldSortable = [],
            rowi,
            coli,
            pt,
            ptData,
            metadi,
            hasMetadata = dataSeries.hasMetadata(),
            metaKeys = dataSeries.getMetadataKeys(),
            metaKeyCount = hasMetadata === true ? metaKeys.length : 0,
            ptmetadata;
        
        for(rowi = 0; rowi < dataSeries.getCount(); rowi++) {

            pt = dataSeries.getPixel(rowi);
            ptData = axes.pixelToData(pt.x, pt.y);
            rawData[rowi] = [];
            
            // transformed coordinates
            for (coli = 0; coli < ptData.length; coli++) {
                rawData[rowi][coli] = ptData[coli];
            }

            // metadata
            for (metadi = 0; metadi < metaKeyCount; metadi++) {
                if (pt.metadata == null || pt.metadata[metadi] == null) {
                    ptmetadata = 0;
                } else {
                    ptmetadata = pt.metadata[metadi];
                }
                rawData[rowi][ptData.length + metadi] = ptmetadata;
            }
        }

        fields = axes.getAxesLabels();
        if(hasMetadata) {
            fields = fields.concat(metaKeys);
        }

        for(coli = 0; coli < fields.length; coli++) {
            if(coli < axes.getDimensions()) {
                connectivityFieldIndices[coli] = coli;
                if(axes.isDate != null && axes.isDate(coli)) {
                    fieldDateFormat[coli] = axes.getInitialDateFormat(coli);
                }
            }
            
            isFieldSortable[coli] = true; // all fields are sortable
        }

        return {
            fields: fields,
            fieldDateFormat: fieldDateFormat,
            rawData: rawData,
            allowConnectivity: true,
            connectivityFieldIndices: connectivityFieldIndices,
            isFieldSortable: isFieldSortable
        };
    }

    return {
        getDatasetNames: getDatasetNames,
        getDatasetIndex: getDatasetIndex,
        setDatasetIndex: setDatasetIndex,
        getData: getData
    };
})();

wpd.measurementDataProvider = (function() {

    var dataSource = 'distance';

    function setDataSource(source) {
        dataSource = source;
    }

    function getDatasetNames() {
        if(dataSource === 'angle') {
            return ['Angle Measurements'];
        } else if (dataSource === 'distance') {
            return ['Distance Measurements'];
        }
    }

    function getDatasetIndex() {
        return 0;
    }

    function setDatasetIndex(index) {
        // ignore
    }

    function getData() {
        var fields = [],
            fieldDateFormat = [],
            rawData = [],
            isFieldSortable = [],
            plotData = wpd.appData.getPlotData(),
            axes = plotData.axes,
            isMap = wpd.appData.isAligned() && (axes instanceof wpd.MapAxes),
            conni,
            mData;
        
        if (dataSource === 'distance') {

            mData = plotData.distanceMeasurementData;
            for(conni = 0; conni < mData.connectionCount(); conni++) {
                rawData[conni] = [];
                rawData[conni][0] = 'Dist' + conni;
                if(isMap) {
                    rawData[conni][1] = axes.pixelToDataDistance(mData.getDistance(conni));
                } else {
                    rawData[conni][1] = mData.getDistance(conni);
                }
            }
            
            fields = ['Label', 'Distance'];
            isFieldSortable = [false, true];

        } else if (dataSource === 'angle') {

            mData = plotData.angleMeasurementData;
            for(conni = 0; conni < mData.connectionCount(); conni++) {
                rawData[conni] = [];
                rawData[conni][0] = 'Theta'+ conni;
                rawData[conni][1] = mData.getAngle(conni);
            }

            fields = ['Label', 'Angle'];
            isFieldSortable = [false, true];
        }

        return {
            fields: fields,
            fieldDateFormat: fieldDateFormat,
            rawData: rawData,
            allowConnectivity: false,
            connectivityFieldIndices: [],
            isFieldSortable: isFieldSortable
        };
    }

    return {
        getDatasetNames: getDatasetNames,
        getDatasetIndex: getDatasetIndex,
        setDatasetIndex: setDatasetIndex,
        setDataSource: setDataSource,
        getData: getData
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.graphicsHelper = (function () {

    // imagePx - relative to original image
    // fillStyle - e.g. "rgb(200,0,0)"
    // label - e.g. "Bar 0"
    function drawPoint(imagePx, fillStyle, label) {
        var screenPx = wpd.graphicsWidget.screenPx(imagePx.x, imagePx.y),
            ctx = wpd.graphicsWidget.getAllContexts(),
            labelWidth,
            imageHeight = wpd.graphicsWidget.getImageSize().height;

        // Display Data Canvas Layer
        if(label != null) {
            ctx.dataCtx.font = "15px sans-serif";
            labelWidth = ctx.dataCtx.measureText(label).width;
            ctx.dataCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.dataCtx.fillRect(screenPx.x - 13, screenPx.y - 8, labelWidth + 5, 35);
            ctx.dataCtx.fillStyle = fillStyle;
            ctx.dataCtx.fillText(label, screenPx.x - 10, screenPx.y + 18);
        }

        ctx.dataCtx.beginPath();
        ctx.dataCtx.fillStyle = fillStyle;
        ctx.dataCtx.strokeStyle = "rgb(255, 255, 255)";
        ctx.dataCtx.arc(screenPx.x, screenPx.y, 4, 0, 2.0*Math.PI, true);
        ctx.dataCtx.fill();
        ctx.dataCtx.stroke();

        // Original Image Data Canvas Layer
        if(label != null) {
            // No translucent background for text here.
            ctx.oriDataCtx.font = "15px sans-serif";
            ctx.oriDataCtx.fillStyle = fillStyle;
            ctx.oriDataCtx.fillText(label, imagePx.x - 10, imagePx.y + 18);
        }

        ctx.oriDataCtx.beginPath();
        ctx.oriDataCtx.fillStyle = fillStyle;
        ctx.oriDataCtx.strokeStyle = "rgb(255, 255, 255)";
        ctx.oriDataCtx.arc(imagePx.x, imagePx.y, imageHeight > 1500 ? 4 : 2, 0, 2.0*Math.PI, true);
        ctx.oriDataCtx.fill();
        ctx.oriDataCtx.stroke();
    }

    return {
        drawPoint : drawPoint
    };

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

wpd = wpd || {};

wpd.gridDetection = (function () {
    
    function start() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();
        wpd.sidebar.show('grid-detection-sidebar');
        sidebarInit();
    }

    function sidebarInit() {
        var $colorPickerBtn = document.getElementById('grid-color-picker-button'),
            $backgroundMode = document.getElementById('grid-background-mode'),
            autodetector = wpd.appData.getPlotData().getAutoDetector(),
            color = autodetector.gridLineColor,
            backgroundMode = autodetector.gridBackgroundMode;

        if(color != null) {
            $colorPickerBtn.style.backgroundColor = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
            if(color[0] + color[1] + color[2] < 200) {
                $colorPickerBtn.style.color = 'rgb(255,255,255)';
            } else {
                $colorPickerBtn.style.color = 'rgb(0,0,0)';
            }
        }

        $backgroundMode.checked = backgroundMode;

        var autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            ctx = wpd.graphicsWidget.getAllContexts(),
            imageSize = wpd.graphicsWidget.getImageSize();
        autoDetector.imageData = ctx.oriImageCtx.getImageData(0, 0, imageSize.width, imageSize.height);
    }

    function markBox() {
        var tool = new wpd.GridBoxTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function viewMask() {
        var tool = new wpd.GridViewMaskTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function clearMask() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.appData.getPlotData().getAutoDetector().gridMask = {
                xmin: null,
                xmax: null,
                ymin: null,
                ymax: null,
                pixels: []
            };
        wpd.graphicsWidget.resetData();
    }

    function grabMask() {
        // Mask is just a list of pixels with the yellow color in the data layer
        var ctx = wpd.graphicsWidget.getAllContexts(),
            imageSize = wpd.graphicsWidget.getImageSize(),
            maskDataPx = ctx.oriDataCtx.getImageData(0, 0, imageSize.width, imageSize.height),
            maskData = [],
            i,
            mi = 0,
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            x, y;
        for(i = 0; i < maskDataPx.data.length; i+=4) {
            if (maskDataPx.data[i] === 255 && maskDataPx.data[i+1] === 255 && maskDataPx.data[i+2] === 0) {
                
                maskData[mi] = i/4; mi++;

                x = parseInt((i/4)%imageSize.width, 10);
                y = parseInt((i/4)/imageSize.width, 10);

                if (mi === 1) {
                    autoDetector.gridMask.xmin = x;
                    autoDetector.gridMask.xmax = x;
                    autoDetector.gridMask.ymin = y;
                    autoDetector.gridMask.ymax = y;
                } else {
                    if (x < autoDetector.gridMask.xmin) {
                        autoDetector.gridMask.xmin = x;
                    }
                    if (x > autoDetector.gridMask.xmax) {
                        autoDetector.gridMask.xmax = x;
                    }
                    if (y < autoDetector.gridMask.ymin) {
                        autoDetector.gridMask.ymin = y;
                    }
                    if (y > autoDetector.gridMask.ymax) {
                        autoDetector.gridMask.ymax = y;
                    }
                }
            }
        }
        autoDetector.gridMask.pixels = maskData;
    }

    function run() {

        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();

        // For now, just reset before detecting, otherwise users will get confused:
        reset();

        var autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            ctx = wpd.graphicsWidget.getAllContexts(),
            imageSize = wpd.graphicsWidget.getImageSize(),
            $xperc = document.getElementById('grid-horiz-perc'),
            $yperc = document.getElementById('grid-vert-perc'),
            horizEnable = document.getElementById('grid-horiz-enable').checked,
            vertEnable = document.getElementById('grid-vert-enable').checked,
            backgroundMode = document.getElementById('grid-background-mode').checked,
            plotData = wpd.appData.getPlotData();
        
        if(plotData.backupImageData == null) {
            plotData.backupImageData = ctx.oriImageCtx.getImageData(0, 0, imageSize.width, imageSize.height);
        }

        autoDetector.imageData = ctx.oriImageCtx.getImageData(0, 0, imageSize.width, imageSize.height);

        autoDetector.generateGridBinaryData();

        // gather detection parameters from GUI

        wpd.gridDetectionCore.setHorizontalParameters(horizEnable, $xperc.value);
        wpd.gridDetectionCore.setVerticalParameters(vertEnable, $yperc.value);
        wpd.gridDetectionCore.run();

        // edit image
        wpd.graphicsWidget.runImageOp(removeGridLinesOp);

        // cleanup memory
        wpd.appData.getPlotData().gridData = null;
    }

    function resetImageOp(idata, width, height) {
        var bkImg = wpd.appData.getPlotData().backupImageData,
            i;

        for(i = 0; i < bkImg.data.length; i++) {
            idata.data[i] = bkImg.data[i];
        }

        return {
            imageData: idata,
            width: width,
            height: height,
            keepZoom: true
        };
    }

    function reset() {
        wpd.graphicsWidget.removeTool();
        wpd.appData.getPlotData().gridData = null;
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();

        var plotData = wpd.appData.getPlotData();
        if(plotData.backupImageData != null) {
            wpd.graphicsWidget.runImageOp(resetImageOp);
        }
    }

    function removeGridLinesOp(idata, width, height) {
        /* image op to remove grid lines */
        var gridData = wpd.appData.getPlotData().gridData,
            bgColor = wpd.appData.getPlotData().topColors[0],
            rowi,
            coli,
            pindex;

        if(bgColor == null) { 
            bgColor = { r: 255, g: 0, b: 0 }; 
        }
        
        if(gridData != null) {
            for(rowi = 0; rowi < height; rowi++) {
                for(coli = 0; coli < width; coli++) {
                    pindex = 4*(rowi*width + coli);
                    if(gridData[pindex/4] === true) {
                        idata.data[pindex] = bgColor.r;
                        idata.data[pindex + 1] = bgColor.g;
                        idata.data[pindex + 2] = bgColor.b;
                        idata.data[pindex + 3] = 255;
                    }
                }
            }
        }

        return {
            imageData: idata,
            width: width,
            height: height
        };
    }

    function startColorPicker() {
        wpd.colorSelectionWidget.setParams({
            color: wpd.appData.getPlotData().getAutoDetector().gridLineColor,
            triggerElementId: 'grid-color-picker-button',
            title: 'Specify Grid Line Color',
            setColorDelegate: function(col) {
                wpd.appData.getPlotData().getAutoDetector().gridLineColor = col;
            }
        });
        wpd.colorSelectionWidget.startPicker();
    }

    function testColor() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.resetData();
        wpd.graphicsWidget.setRepainter(new wpd.GridColorFilterRepainter());

        var autoDetector = wpd.appData.getPlotData().getAutoDetector();

        changeColorDistance();
        autoDetector.generateGridBinaryData();

        wpd.colorSelectionWidget.paintFilteredColor(autoDetector.gridBinaryData, autoDetector.gridMask.pixels);
    }

    function changeColorDistance() {
        var color_distance = parseFloat(document.getElementById('grid-color-distance').value);
        wpd.appData.getPlotData().getAutoDetector().gridColorDistance = color_distance;
    }

    function changeBackgroundMode() {
        var backgroundMode = document.getElementById('grid-background-mode').checked;
        wpd.appData.getPlotData().getAutoDetector().gridBackgroundMode = backgroundMode;
    }
     
    return {
        start: start,
        markBox: markBox,
        clearMask: clearMask,
        viewMask: viewMask,
        grabMask: grabMask,
        startColorPicker: startColorPicker,
        changeColorDistance: changeColorDistance,
        changeBackgroundMode: changeBackgroundMode,
        testColor: testColor,
        run: run,
        reset: reset
    };
})();


wpd.GridColorFilterRepainter = (function () {
    var Painter = function () {
        this.painterName = 'gridColorFilterRepainter';

        this.onRedraw = function () {
            var autoDetector = wpd.appData.getPlotData().getAutoDetector();
            wpd.colorSelectionWidget.paintFilteredColor(autoDetector.gridBinaryData, autoDetector.gridMask.pixels);
        };
    }
    return Painter;
})();


// TODO: Think of reusing mask.js code here
wpd.GridBoxTool = (function () {
    var Tool = function () {
        var isDrawing = false,
            topImageCorner,
            topScreenCorner,
            ctx = wpd.graphicsWidget.getAllContexts(),
            moveTimer,
            screen_pos,

            mouseMoveHandler = function () {
                wpd.graphicsWidget.resetHover();
                ctx.hoverCtx.strokeStyle = "rgb(0,0,0)";
    		    ctx.hoverCtx.strokeRect(topScreenCorner.x, topScreenCorner.y, screen_pos.x - topScreenCorner.x, screen_pos.y - topScreenCorner.y);
            },

            mouseUpHandler = function (ev, pos, imagePos) {
                if(isDrawing === false) {
                    return;
                }
                clearTimeout(moveTimer);
                isDrawing = false;
                wpd.graphicsWidget.resetHover();
                ctx.dataCtx.fillStyle = "rgba(255,255,0,0.8)";
                ctx.dataCtx.fillRect(topScreenCorner.x, topScreenCorner.y, pos.x-topScreenCorner.x, pos.y-topScreenCorner.y);
                ctx.oriDataCtx.fillStyle = "rgba(255,255,0,0.8)";
                ctx.oriDataCtx.fillRect(topImageCorner.x, topImageCorner.y, imagePos.x - topImageCorner.x, imagePos.y - topImageCorner.y);
            },

            mouseOutPos = null,
            mouseOutImagePos = null;

        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.GridMaskPainter());
            document.getElementById('grid-mask-box').classList.add('pressed-button');
            document.getElementById('grid-mask-view').classList.add('pressed-button');
        };

        this.onMouseDown = function (ev, pos, imagePos) {
            if(isDrawing === true) return;
            isDrawing = true;
            topImageCorner = imagePos;
            topScreenCorner = pos;
        };

        this.onMouseMove = function (ev, pos, imagePos) {
            if(isDrawing === false) return;
            screen_pos = pos;
            clearTimeout(moveTimer);
            moveTimer = setTimeout(mouseMoveHandler, 2);
        };

        this.onMouseOut = function (ev, pos, imagePos) {
            if(isDrawing === true) {
                clearTimeout(moveTimer);
                mouseOutPos = pos;
                mouseOutImagePos = imagePos;
            }
        };

        this.onDocumentMouseUp = function (ev, pos, imagePos) {
            if (mouseOutPos != null && mouseOutImagePos != null) {
                mouseUpHandler(ev, mouseOutPos, mouseOutImagePos);
            } else {
                mouseUpHandler(ev, pos, imagePos);
            }
            mouseOutPos = null;
            mouseOutImagePos = null;
        };

        this.onMouseUp = function (ev, pos, imagePos) {
            mouseUpHandler(ev, pos, imagePos);
        };

        this.onRemove = function () {
            document.getElementById('grid-mask-box').classList.remove('pressed-button');
            document.getElementById('grid-mask-view').classList.remove('pressed-button');
            wpd.gridDetection.grabMask();
        };
    };
    return Tool;
})();


wpd.GridViewMaskTool = (function () {
    var Tool = function() {

        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.GridMaskPainter());
            document.getElementById('grid-mask-view').classList.add('pressed-button');
        };

        this.onRemove = function () {
            document.getElementById('grid-mask-view').classList.remove('pressed-button');
            wpd.gridDetection.grabMask();
        };
    };

    return Tool;
})();


wpd.GridMaskPainter = (function () {
    var Painter = function () {

        var ctx = wpd.graphicsWidget.getAllContexts(),
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            painter = function () {
                if(autoDetector.gridMask.pixels == null || autoDetector.gridMask.pixels.length === 0) {
                    return;
                }
                var maski, img_index,
                    imageSize = wpd.graphicsWidget.getImageSize();
                    imgData = ctx.oriDataCtx.getImageData(0, 0, imageSize.width, imageSize.height);

                for(maski = 0; maski < autoDetector.gridMask.pixels.length; maski++) {
                    img_index = autoDetector.gridMask.pixels[maski];
                    imgData.data[img_index*4] = 255;
                    imgData.data[img_index*4+1] = 255;
                    imgData.data[img_index*4+2] = 0;
                    imgData.data[img_index*4+3] = 200;
                }

                ctx.oriDataCtx.putImageData(imgData, 0, 0);
                wpd.graphicsWidget.copyImageDataLayerToScreen();
            };

        this.painterName = 'gridMaskPainter';

        this.onRedraw = function () {
            wpd.gridDetection.grabMask();
            painter();
        };

        this.onAttach = function () {
            wpd.graphicsWidget.resetData();
            painter();
        };
    };
    return Painter;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/
wpd = wpd || {};

wpd.imageOps = (function () {

    function hflipOp(idata, iwidth, iheight) {
        var rowi, coli, index, mindex, tval, p;
        for(rowi = 0; rowi < iheight; rowi++) {
            for(coli = 0; coli < iwidth/2; coli++) {
                index = 4*(rowi*iwidth + coli);
                mindex = 4*((rowi+1)*iwidth - (coli+1));
                for(p = 0; p < 4; p++) {
                    tval = idata.data[index + p];
                    idata.data[index + p] = idata.data[mindex + p];
                    idata.data[mindex + p] = tval;
                }
            }
        }
        return {
            imageData: idata,
            width: iwidth,
            height: iheight
        };
    }

    function vflipOp(idata, iwidth, iheight) {
        var rowi, coli, index, mindex, tval, p;
        for(rowi = 0; rowi < iheight/2; rowi++) {
            for(coli = 0; coli < iwidth; coli++) {
                index = 4*(rowi*iwidth + coli);
                mindex = 4*((iheight - (rowi+2))*iwidth + coli);
                for(p = 0; p < 4; p++) {
                    tval = idata.data[index + p];
                    idata.data[index + p] = idata.data[mindex + p];
                    idata.data[mindex + p] = tval;
                }
            }
        }
        return {
            imageData: idata,
            width: iwidth,
            height: iheight
        };
    }

    function hflip() {
        wpd.graphicsWidget.runImageOp(hflipOp);
    }

    function vflip() {
        wpd.graphicsWidget.runImageOp(vflipOp);
    }

    return {
        hflip: hflip,
        vflip: vflip
    };
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.keyCodes = (function () {
    return {
        isUp: function(code) {
            return code === 38;
        },
        isDown: function(code) {
            return code === 40;
        },
        isLeft: function(code) {
            return code === 37;
        },
        isRight: function(code) {
            return code === 39;
        },
        isTab: function(code) {
            return code === 9;
        },
        isDel: function(code) {
            return code === 46;
        },
        isBackspace: function(code) {
            return code === 8;
        },
        isAlphabet: function(code, alpha) {
            if (code > 90 || code < 65) {
                return false;
            }
            return String.fromCharCode(code).toLowerCase() === alpha;
        },
        isEnter: function(code) {
            return code === 13;
        },
        isEsc: function(code) {
            return code === 27;
        }
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.acquireData = (function () {
    function load() {
        if(!wpd.appData.isAligned()) {
            wpd.messagePopup.show(wpd.gettext('acquire-data'), wpd.gettext('acquire-data-calibration'));
        } else {
            showSidebar();
            wpd.dataPointCounter.setCount();
            wpd.graphicsWidget.removeTool();
            wpd.graphicsWidget.setRepainter(new wpd.DataPointsRepainter());

            manualSelection();
        }
    }

    function manualSelection() {
        var tool = new wpd.ManualSelectionTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function deletePoint() {
        var tool = new wpd.DeleteDataPointTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function confirmedClearAll() {
        wpd.appData.getPlotData().getActiveDataSeries().clearAll();
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.resetData();
        wpd.dataPointCounter.setCount();
        wpd.graphicsWidget.removeRepainter();
    }

    function clearAll() {
        if(wpd.appData.getPlotData().getActiveDataSeries().getCount() <= 0) {
            return;
        }
        wpd.okCancelPopup.show(wpd.gettext('clear-data-points'), wpd.gettext('clear-data-points-text'), confirmedClearAll, function() {});
    }

    function undo() {
        wpd.appData.getPlotData().getActiveDataSeries().removeLastPixel();
        wpd.graphicsWidget.resetData();
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.dataPointCounter.setCount();
    }
 
    function showSidebar() {
        wpd.sidebar.show('acquireDataSidebar');
        updateDatasetControl();
        updateControlVisibility();
        wpd.dataPointCounter.setCount();
    }

    function updateControlVisibility() {
        var axes = wpd.appData.getPlotData().axes,
            $editLabelsBtn = document.getElementById('edit-data-labels');
        if(axes instanceof wpd.BarAxes) {
            $editLabelsBtn.style.display = 'inline-block';
        } else {
            $editLabelsBtn.style.display = 'none';
        }
    }

    function updateDatasetControl() {
        var plotData = wpd.appData.getPlotData(),
            currentDataset = plotData.getActiveDataSeries(), // just to create a dataset if there is none.
            currentIndex = plotData.getActiveDataSeriesIndex(),
            $datasetList = document.getElementById('manual-sidebar-dataset-list'),
            listHTML = '',
            i;
        for(i = 0; i < plotData.dataSeriesColl.length; i++) {
            listHTML += '<option>'+plotData.dataSeriesColl[i].name+'</option>';
        }
        $datasetList.innerHTML = listHTML;
        $datasetList.selectedIndex = currentIndex;
    }

    function changeDataset($datasetList) {
        var index = $datasetList.selectedIndex;
        wpd.appData.getPlotData().setActiveDataSeriesIndex(index);
        wpd.graphicsWidget.forceHandlerRepaint();
        wpd.dataPointCounter.setCount();
    }

    function adjustPoints() {
        wpd.graphicsWidget.setTool(new wpd.AdjustDataPointTool());
    }

    function editLabels() {
        wpd.graphicsWidget.setTool(new wpd.EditLabelsTool());
    }

    function switchToolOnKeyPress(alphaKey) {
        switch(alphaKey) {
            case 'd': 
                deletePoint();
                break;
            case 'a': 
                manualSelection();
                break;
            case 's': 
                adjustPoints();
                break;
            case 'e':
                editLabels();
                break;
            default: 
                break;
        }
    }

    function isToolSwitchKey(keyCode) {
        if(wpd.keyCodes.isAlphabet(keyCode, 'a')
            || wpd.keyCodes.isAlphabet(keyCode, 's')
            || wpd.keyCodes.isAlphabet(keyCode, 'd')
            || wpd.keyCodes.isAlphabet(keyCode, 'e')) {
            return true;
        }
        return false;
    }

    return {
        load: load,
        manualSelection: manualSelection,
        adjustPoints: adjustPoints,
        deletePoint: deletePoint,
        clearAll: clearAll,
        undo: undo,
        showSidebar: showSidebar,
        switchToolOnKeyPress: switchToolOnKeyPress,
        isToolSwitchKey: isToolSwitchKey,
        updateDatasetControl: updateDatasetControl,
        changeDataset: changeDataset,
        editLabels: editLabels
    };
})();

wpd.dataPointLabelEditor = (function() {

    var ds, ptIndex, tool;
    
    function show(dataSeries, pointIndex, initTool) {
        var pixel = dataSeries.getPixel(pointIndex),
            originalLabel = pixel.metadata[0],
            $labelField;
        
        ds = dataSeries;
        ptIndex = pointIndex;
        tool = initTool;

        wpd.graphicsWidget.removeTool();

        // show popup window with originalLabel in the input field.
        wpd.popup.show('data-point-label-editor');
        $labelField = document.getElementById('data-point-label-field');
        $labelField.value = originalLabel;
        $labelField.focus();
    }

    function ok() {
        var newLabel = document.getElementById('data-point-label-field').value;

        if(newLabel != null && newLabel.length > 0) {
            // set label 
            ds.setMetadataAt(ptIndex, [newLabel]);
            // refresh graphics
            wpd.graphicsWidget.resetData();
            wpd.graphicsWidget.forceHandlerRepaint();
        }

        wpd.popup.close('data-point-label-editor');
        wpd.graphicsWidget.setTool(tool);
    }

    function cancel() {
        // just close the popup
        wpd.popup.close('data-point-label-editor');
        wpd.graphicsWidget.setTool(tool);
    }

    function keydown(ev) {
        if(wpd.keyCodes.isEnter(ev.keyCode)) {
            ok();
        } else if(wpd.keyCodes.isEsc(ev.keyCode)) {
            cancel();
        }
        ev.stopPropagation();
    }

    return {
        show: show,
        ok: ok,
        cancel: cancel,
        keydown: keydown
    };
})();

wpd.ManualSelectionTool = (function () {
    var Tool = function () {
        var plotData = wpd.appData.getPlotData();

        this.onAttach = function () {
            document.getElementById('manual-select-button').classList.add('pressed-button');
            wpd.graphicsWidget.setRepainter(new wpd.DataPointsRepainter());
        };

       
        this.onMouseClick = function (ev, pos, imagePos) {
            var activeDataSeries = plotData.getActiveDataSeries(),
                pointLabel,
                mkeys;
            
            if(plotData.axes.dataPointsHaveLabels) { // e.g. Bar charts

                // This isn't the cleanest approach, but should do for now:
                mkeys = activeDataSeries.getMetadataKeys();
                if(mkeys == null || mkeys[0] !== 'Label') {
                    activeDataSeries.setMetadataKeys(['Label']);
                }
                pointLabel = plotData.axes.dataPointsLabelPrefix + activeDataSeries.getCount();
                activeDataSeries.addPixel(imagePos.x, imagePos.y, [pointLabel]);
                wpd.graphicsHelper.drawPoint(imagePos, "rgb(200,0,0)", pointLabel);

            } else {

                activeDataSeries.addPixel(imagePos.x, imagePos.y);
                wpd.graphicsHelper.drawPoint(imagePos, "rgb(200,0,0)");

            }

            wpd.graphicsWidget.updateZoomOnEvent(ev);
            wpd.dataPointCounter.setCount();

            // If shiftkey was pressed while clicking on a point that has a label (e.g. bar charts),
            // then show a popup to edit the label
            if(plotData.axes.dataPointsHaveLabels && ev.shiftKey) {
                wpd.dataPointLabelEditor.show(activeDataSeries, activeDataSeries.getCount() - 1, this);
            }
        };

        this.onRemove = function () {
            document.getElementById('manual-select-button').classList.remove('pressed-button');
        };

        this.onKeyDown = function (ev) {
            var activeDataSeries = plotData.getActiveDataSeries(),
                lastPtIndex = activeDataSeries.getCount() - 1,
                lastPt = activeDataSeries.getPixel(lastPtIndex),
                stepSize = 0.5/wpd.graphicsWidget.getZoomRatio();

            if(wpd.keyCodes.isUp(ev.keyCode)) {
                lastPt.y = lastPt.y - stepSize;
            } else if(wpd.keyCodes.isDown(ev.keyCode)) {
                lastPt.y = lastPt.y + stepSize;
            } else if(wpd.keyCodes.isLeft(ev.keyCode)) {
                lastPt.x = lastPt.x - stepSize;
            } else if(wpd.keyCodes.isRight(ev.keyCode)) {
                lastPt.x = lastPt.x + stepSize;
            } else if(wpd.acquireData.isToolSwitchKey(ev.keyCode)) {
                wpd.acquireData.switchToolOnKeyPress(String.fromCharCode(ev.keyCode).toLowerCase());
                return;
            } else {
                return;
            }

            activeDataSeries.setPixelAt(lastPtIndex, lastPt.x, lastPt.y);
            wpd.graphicsWidget.resetData();
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomToImagePosn(lastPt.x, lastPt.y);
            ev.preventDefault();
        };
    };
    return Tool;
})();


wpd.DeleteDataPointTool = (function () {
    var Tool = function () {
        var ctx = wpd.graphicsWidget.getAllContexts(),
            plotData = wpd.appData.getPlotData();

        this.onAttach = function () {
            document.getElementById('delete-point-button').classList.add('pressed-button');
            wpd.graphicsWidget.setRepainter(new wpd.DataPointsRepainter());
        };

        this.onMouseClick = function(ev, pos, imagePos) {
            var activeDataSeries = plotData.getActiveDataSeries();
            activeDataSeries.removeNearestPixel(imagePos.x, imagePos.y);
            wpd.graphicsWidget.resetData();
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomOnEvent(ev);
            wpd.dataPointCounter.setCount();
        };

        this.onKeyDown = function (ev) {
            if(wpd.acquireData.isToolSwitchKey(ev.keyCode)) {
                wpd.acquireData.switchToolOnKeyPress(String.fromCharCode(ev.keyCode).toLowerCase());
            }
        };

        this.onRemove = function () {
            document.getElementById('delete-point-button').classList.remove('pressed-button');
        };
    };
    return Tool;
})();


wpd.DataPointsRepainter = (function () {
    var Painter = function () {

        var drawPoints = function () {
            var plotData = wpd.appData.getPlotData(),
                activeDataSeries = plotData.getActiveDataSeries(),
                dindex,
                imagePos,
                fillStyle,
                isSelected,
                mkeys = activeDataSeries.getMetadataKeys(),
                hasLabels = false,
                pointLabel;

            if(plotData.axes == null) {
                return; // this can happen when removing widgets when a new file is loaded:
            }

            if(plotData.axes.dataPointsHaveLabels && mkeys != null && mkeys[0] === 'Label') {
                hasLabels = true;
            }

            for(dindex = 0; dindex < activeDataSeries.getCount(); dindex++) {
                imagePos = activeDataSeries.getPixel(dindex);
                isSelected = activeDataSeries.getSelectedPixels().indexOf(dindex) >= 0;

                if(isSelected) {
                    fillStyle = "rgb(0,200,0)";
                } else {
                    fillStyle = "rgb(200,0,0)";
                }

                if (hasLabels) {
                    pointLabel = imagePos.metadata[0];
                    if(pointLabel == null) {
                        pointLabel = plotData.axes.dataPointsLabelPrefix + dindex;
                    }
                    wpd.graphicsHelper.drawPoint(imagePos, fillStyle, pointLabel);
                } else {
                    wpd.graphicsHelper.drawPoint(imagePos, fillStyle);
                }
            }
        };
        
        this.painterName = 'dataPointsRepainter';

        this.onAttach = function () {
            wpd.graphicsWidget.resetData();
            drawPoints();
        };

        this.onRedraw = function () {
            drawPoints();
        };

        this.onForcedRedraw = function () {
            wpd.graphicsWidget.resetData();
            drawPoints();
        };
    };
    return Painter;
})();


wpd.AdjustDataPointTool = (function () {
    var Tool = function () {

        this.onAttach = function () {
            document.getElementById('manual-adjust-button').classList.add('pressed-button');
            wpd.graphicsWidget.setRepainter(new wpd.DataPointsRepainter());
            wpd.toolbar.show('adjustDataPointsToolbar');
        }; 
        
        this.onRemove = function () {
            var dataSeries = wpd.appData.getPlotData().getActiveDataSeries();
            dataSeries.unselectAll();
            wpd.graphicsWidget.forceHandlerRepaint();
            document.getElementById('manual-adjust-button').classList.remove('pressed-button');
            wpd.toolbar.clear();
        };

        this.onMouseClick = function (ev, pos, imagePos) {
            var dataSeries = wpd.appData.getPlotData().getActiveDataSeries();
            dataSeries.unselectAll();
            dataSeries.selectNearestPixel(imagePos.x, imagePos.y);
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomOnEvent(ev);
        };

        this.onKeyDown = function (ev) {

            if (wpd.acquireData.isToolSwitchKey(ev.keyCode)) {
                wpd.acquireData.switchToolOnKeyPress(String.fromCharCode(ev.keyCode).toLowerCase());
                return;
            }

            var activeDataSeries = wpd.appData.getPlotData().getActiveDataSeries(),
                selIndex = activeDataSeries.getSelectedPixels()[0];

            if(selIndex == null) { return; }

            var selPoint = activeDataSeries.getPixel(selIndex),
                pointPx = selPoint.x,
                pointPy = selPoint.y,
                stepSize = ev.shiftKey === true ? 5/wpd.graphicsWidget.getZoomRatio() : 0.5/wpd.graphicsWidget.getZoomRatio();

            if(wpd.keyCodes.isUp(ev.keyCode)) {
                pointPy = pointPy - stepSize;
            } else if(wpd.keyCodes.isDown(ev.keyCode)) {
                pointPy = pointPy + stepSize;
            } else if(wpd.keyCodes.isLeft(ev.keyCode)) {
                pointPx = pointPx - stepSize;
            } else if(wpd.keyCodes.isRight(ev.keyCode)) {
                pointPx = pointPx + stepSize;
            } else if(wpd.keyCodes.isAlphabet(ev.keyCode, 'q')) {
                activeDataSeries.selectPreviousPixel();
                selIndex = activeDataSeries.getSelectedPixels()[0];
                selPoint = activeDataSeries.getPixel(selIndex);
                pointPx = selPoint.x;
                pointPy = selPoint.y;
            } else if(wpd.keyCodes.isAlphabet(ev.keyCode, 'w')) {
                activeDataSeries.selectNextPixel();
                selIndex = activeDataSeries.getSelectedPixels()[0];
                selPoint = activeDataSeries.getPixel(selIndex);
                pointPx = selPoint.x;
                pointPy = selPoint.y;
            } else if(wpd.keyCodes.isAlphabet(ev.keyCode, 'e')) {
                if(wpd.appData.getPlotData().axes.dataPointsHaveLabels) {
                    selIndex = activeDataSeries.getSelectedPixels()[0];
                    ev.preventDefault();
                    ev.stopPropagation();
                    wpd.dataPointLabelEditor.show(activeDataSeries, selIndex, this);
                    return;
                }
            } else if(wpd.keyCodes.isDel(ev.keyCode) || wpd.keyCodes.isBackspace(ev.keyCode)) {
                activeDataSeries.removePixelAtIndex(selIndex);
                activeDataSeries.unselectAll();
                if(activeDataSeries.findNearestPixel(pointPx, pointPy) >= 0) {
                    activeDataSeries.selectNearestPixel(pointPx, pointPy);
                    selIndex = activeDataSeries.getSelectedPixels()[0];
                    selPoint = activeDataSeries.getPixel(selIndex);
                    pointPx = selPoint.x;
                    pointPy = selPoint.y;
                }
                wpd.graphicsWidget.resetData();
                wpd.graphicsWidget.forceHandlerRepaint();
                wpd.graphicsWidget.updateZoomToImagePosn(pointPx, pointPy);
                wpd.dataPointCounter.setCount();
                ev.preventDefault();
                ev.stopPropagation();
                return;
            } else {
                return;
            }
            
            activeDataSeries.setPixelAt(selIndex, pointPx, pointPy);
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomToImagePosn(pointPx, pointPy);
            ev.preventDefault();
            ev.stopPropagation(); 
        };
    };
    return Tool;
})();

wpd.EditLabelsTool = function() {

    this.onAttach = function () {
        document.getElementById('edit-data-labels').classList.add('pressed-button');
        wpd.graphicsWidget.setRepainter(new wpd.DataPointsRepainter());
    };

    this.onRemove = function () {
        document.getElementById('edit-data-labels').classList.remove('pressed-button');
        wpd.appData.getPlotData().getActiveDataSeries().unselectAll();
    };

    this.onMouseClick = function (ev, pos, imagePos) {
        var dataSeries = wpd.appData.getPlotData().getActiveDataSeries(),
            pixelIndex;
        dataSeries.unselectAll();
        pixelIndex = dataSeries.selectNearestPixel(imagePos.x, imagePos.y);
        if(pixelIndex >= 0) { 
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomOnEvent(ev);
            wpd.dataPointLabelEditor.show(dataSeries, pixelIndex, this);
        }
    };

    this.onKeyDown = function (ev) {
        if(wpd.acquireData.isToolSwitchKey(ev.keyCode)) {
            wpd.acquireData.switchToolOnKeyPress(String.fromCharCode(ev.keyCode).toLowerCase());
        }
    };
};

wpd.dataPointCounter = (function () {
    function setCount() {
        var $counters = document.getElementsByClassName('data-point-counter'),
            ci;
        for(ci = 0; ci < $counters.length; ci++) {
            $counters[ci].innerHTML = wpd.appData.getPlotData().getActiveDataSeries().getCount();
        }
    }

    return {
        setCount: setCount
    };
})();

/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};
wpd.dataMask = (function () {

    function grabMask() {
        // Mask is just a list of pixels with the yellow color in the data layer
        var ctx = wpd.graphicsWidget.getAllContexts(),
            imageSize = wpd.graphicsWidget.getImageSize(),
            maskDataPx = ctx.oriDataCtx.getImageData(0, 0, imageSize.width, imageSize.height),
            maskData = [],
            i,
            mi = 0,
            autoDetector = wpd.appData.getPlotData().getAutoDetector();
        for(i = 0; i < maskDataPx.data.length; i+=4) {
            if (maskDataPx.data[i] === 255 && maskDataPx.data[i+1] === 255 && maskDataPx.data[i+2] === 0) {
                maskData[mi] = i/4; mi++;
            }
        }
        autoDetector.mask = maskData;
    }

    function markBox() {
        var tool = new wpd.BoxMaskTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function markPen() {
        var tool = new wpd.PenMaskTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function eraseMarks() {
        var tool = new wpd.EraseMaskTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function viewMask() {
        var tool = new wpd.ViewMaskTool();
        wpd.graphicsWidget.setTool(tool);
    }

    function clearMask() {
        wpd.graphicsWidget.resetData();
        grabMask();
    }

    return {
        grabMask: grabMask,
        markBox: markBox,
        markPen: markPen,
        eraseMarks: eraseMarks,
        viewMask: viewMask,
        clearMask: clearMask
    };
})();

wpd.BoxMaskTool = (function () {
    var Tool = function () {
        var isDrawing = false,
            topImageCorner,
            topScreenCorner,
            ctx = wpd.graphicsWidget.getAllContexts(),
            moveTimer,
            screen_pos,

            mouseMoveHandler = function() {
                wpd.graphicsWidget.resetHover();
                ctx.hoverCtx.strokeStyle = "rgb(0,0,0)";
    		ctx.hoverCtx.strokeRect(topScreenCorner.x, topScreenCorner.y, screen_pos.x - topScreenCorner.x, screen_pos.y - topScreenCorner.y);
            },
            
            mouseUpHandler = function (ev, pos, imagePos) {
                if(isDrawing === false) {
                    return;
                }
                clearTimeout(moveTimer);
                isDrawing = false;
                wpd.graphicsWidget.resetHover();
                ctx.dataCtx.fillStyle = "rgba(255,255,0,1)";
                ctx.dataCtx.fillRect(topScreenCorner.x, topScreenCorner.y, pos.x-topScreenCorner.x, pos.y-topScreenCorner.y);
                ctx.oriDataCtx.fillStyle = "rgba(255,255,0,1)";
                ctx.oriDataCtx.fillRect(topImageCorner.x, topImageCorner.y, imagePos.x - topImageCorner.x, imagePos.y - topImageCorner.y);
            },
            
            mouseOutPos = null,
            mouseOutImagePos = null;

        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.MaskPainter());
            document.getElementById('box-mask').classList.add('pressed-button');
            document.getElementById('view-mask').classList.add('pressed-button');
        };

        this.onMouseDown = function(ev, pos, imagePos) {
            if(isDrawing === true) return;
            isDrawing = true;
            topImageCorner = imagePos;
            topScreenCorner = pos;
        };

        this.onMouseMove = function(ev, pos, imagePos) {
            if(isDrawing === false) return;
            screen_pos = pos;
            clearTimeout(moveTimer);
            moveTimer = setTimeout(mouseMoveHandler, 2);
        };

        this.onMouseOut = function (ev, pos, imagePos) {
            if(isDrawing === true) {
                clearTimeout(moveTimer);
                mouseOutPos = pos;
                mouseOutImagePos = imagePos;
            }
        };

        this.onDocumentMouseUp = function(ev, pos, imagePos) {
            if (mouseOutPos != null && mouseOutImagePos != null) {
                mouseUpHandler(ev, mouseOutPos, mouseOutImagePos);
            } else {
                mouseUpHandler(ev, pos, imagePos);
            }
            mouseOutPos = null;
            mouseOutImagePos = null;
        };

        this.onMouseUp = function(ev, pos, imagePos) {
            mouseUpHandler(ev, pos, imagePos);
        };

        this.onRemove = function () {
            document.getElementById('box-mask').classList.remove('pressed-button');
            document.getElementById('view-mask').classList.remove('pressed-button');
            wpd.dataMask.grabMask();
        };
    };
    return Tool;
})();

wpd.PenMaskTool = (function () {
    var Tool = function () {
        var strokeWidth,
            ctx = wpd.graphicsWidget.getAllContexts(),
            isDrawing = false,
            moveTimer,
            screen_pos, image_pos,
            mouseMoveHandler = function() {
                ctx.dataCtx.strokeStyle = "rgba(255,255,0,1)";
        	ctx.dataCtx.lineTo(screen_pos.x,screen_pos.y);
                ctx.dataCtx.stroke();

                ctx.oriDataCtx.strokeStyle = "rgba(255,255,0,1)";
        	ctx.oriDataCtx.lineTo(image_pos.x,image_pos.y);
                ctx.oriDataCtx.stroke();
            };

        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.MaskPainter());
            document.getElementById('pen-mask').classList.add('pressed-button');
            document.getElementById('view-mask').classList.add('pressed-button');
            wpd.toolbar.show('paintToolbar');
        };

        this.onMouseDown = function(ev, pos, imagePos) {
            if(isDrawing === true) return;
            var lwidth = parseInt(document.getElementById('paintThickness').value, 10);
            isDrawing = true;
            ctx.dataCtx.strokeStyle = "rgba(255,255,0,1)";
            ctx.dataCtx.lineWidth = lwidth*wpd.graphicsWidget.getZoomRatio();
	    ctx.dataCtx.beginPath();
            ctx.dataCtx.moveTo(pos.x,pos.y);

            ctx.oriDataCtx.strokeStyle = "rgba(255,255,0,1)";
            ctx.oriDataCtx.lineWidth = lwidth;
	    ctx.oriDataCtx.beginPath();
            ctx.oriDataCtx.moveTo(imagePos.x,imagePos.y);
        };

        this.onMouseMove = function(ev, pos, imagePos) {
            if(isDrawing === false) return;
            screen_pos = pos;
            image_pos = imagePos;
            clearTimeout(moveTimer);
            moveTimer = setTimeout(mouseMoveHandler, 2);
        };

        this.onMouseUp = function(ev, pos, imagePos) {
            clearTimeout(moveTimer);
            ctx.dataCtx.closePath();
            ctx.dataCtx.lineWidth = 1;
            ctx.oriDataCtx.closePath();
            ctx.oriDataCtx.lineWidth = 1;
            isDrawing = false;
        };
        
        this.onMouseOut = function(ev, pos, imagePos) {
            this.onMouseUp(ev, pos, imagePos);
        };

        this.onRemove = function() {
            document.getElementById('pen-mask').classList.remove('pressed-button');
            document.getElementById('view-mask').classList.remove('pressed-button');
            wpd.dataMask.grabMask();
            wpd.toolbar.clear();
        };

    };
    return Tool;
})();

wpd.EraseMaskTool = (function () {
    var Tool = function() {
        var strokeWidth,
            ctx = wpd.graphicsWidget.getAllContexts(),
            isDrawing = false,
            moveTimer,
            screen_pos, image_pos,
            mouseMoveHandler = function() {

                ctx.dataCtx.globalCompositeOperation = "destination-out";
                ctx.oriDataCtx.globalCompositeOperation = "destination-out";
                
                ctx.dataCtx.strokeStyle = "rgba(255,255,0,1)";
                ctx.dataCtx.lineTo(screen_pos.x,screen_pos.y);
                ctx.dataCtx.stroke();
                
                ctx.oriDataCtx.strokeStyle = "rgba(255,255,0,1)";
                ctx.oriDataCtx.lineTo(image_pos.x,image_pos.y);
                ctx.oriDataCtx.stroke();
            };

        this.onAttach = function() {
             wpd.graphicsWidget.setRepainter(new wpd.MaskPainter());
             document.getElementById('erase-mask').classList.add('pressed-button');
             document.getElementById('view-mask').classList.add('pressed-button');
             wpd.toolbar.show('eraseToolbar');
        };

        this.onMouseDown = function(ev, pos, imagePos) {
            if(isDrawing === true) return;
            var lwidth = parseInt(document.getElementById('eraseThickness').value, 10);
            isDrawing = true;
            ctx.dataCtx.globalCompositeOperation = "destination-out";
            ctx.oriDataCtx.globalCompositeOperation = "destination-out";

            ctx.dataCtx.strokeStyle = "rgba(0,0,0,1)";
            ctx.dataCtx.lineWidth = lwidth*wpd.graphicsWidget.getZoomRatio();
            ctx.dataCtx.beginPath();
            ctx.dataCtx.moveTo(pos.x,pos.y);

            ctx.oriDataCtx.strokeStyle = "rgba(0,0,0,1)";
            ctx.oriDataCtx.lineWidth = lwidth;
            ctx.oriDataCtx.beginPath();
            ctx.oriDataCtx.moveTo(imagePos.x,imagePos.y);
        };

        this.onMouseMove = function(ev, pos, imagePos) {
            if(isDrawing === false) return;
            screen_pos = pos;
            image_pos = imagePos;
            clearTimeout(moveTimer);
            moveTimer = setTimeout(mouseMoveHandler, 2);
        };

        this.onMouseOut = function(ev, pos, imagePos) {
            this.onMouseUp(ev, pos, imagePos);
        };

        this.onMouseUp = function(ev, pos, imagePos) {
            clearTimeout(moveTimer);
            ctx.dataCtx.closePath();
            ctx.dataCtx.lineWidth = 1;
            ctx.oriDataCtx.closePath();
            ctx.oriDataCtx.lineWidth = 1;

            ctx.dataCtx.globalCompositeOperation = "source-over";
            ctx.oriDataCtx.globalCompositeOperation = "source-over";

            isDrawing = false;
        };

        this.onRemove = function() {
            document.getElementById('erase-mask').classList.remove('pressed-button');
            document.getElementById('view-mask').classList.remove('pressed-button');
            wpd.dataMask.grabMask();
            wpd.toolbar.clear();
        };
       
    };
    return Tool;
})();

wpd.ViewMaskTool = (function() {

    var Tool = function() {

        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.MaskPainter());
            document.getElementById('view-mask').classList.add('pressed-button');
        };

        this.onRemove = function () {
            document.getElementById('view-mask').classList.remove('pressed-button');
            wpd.dataMask.grabMask();
        };
    };

    return Tool;
})();

wpd.MaskPainter = (function() {
    var Painter = function () {

        var ctx = wpd.graphicsWidget.getAllContexts(),
            autoDetector = wpd.appData.getPlotData().getAutoDetector(),
            painter = function () {
                if(autoDetector.mask == null || autoDetector.mask.length === 0) {
                    return;
                }
                var maski, img_index,
                    imageSize = wpd.graphicsWidget.getImageSize();
                    imgData = ctx.oriDataCtx.getImageData(0, 0, imageSize.width, imageSize.height);

                for(maski = 0; maski < autoDetector.mask.length; maski++) {
                    img_index = autoDetector.mask[maski];
                    imgData.data[img_index*4] = 255;
                    imgData.data[img_index*4+1] = 255;
                    imgData.data[img_index*4+2] = 0;
                    imgData.data[img_index*4+3] = 255;
                }

                ctx.oriDataCtx.putImageData(imgData, 0, 0);
                wpd.graphicsWidget.copyImageDataLayerToScreen();
            };

        this.painterName = 'dataMaskPainter';

        this.onRedraw = function () {
            wpd.dataMask.grabMask();
            painter();
        };

        this.onAttach = function () {
            wpd.graphicsWidget.resetData();
            painter();
        };
    };
    return Painter;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.measurementModes = {
    distance: {
        name: 'distance',
        connectivity: 2,
        addButtonId: 'add-pair-button',
        deleteButtonId: 'delete-pair-button',
        sidebarId: 'measure-distances-sidebar',
        init: function() {
            var plotData = wpd.appData.getPlotData();
            if(plotData.distanceMeasurementData == null) {
                plotData.distanceMeasurementData = new wpd.ConnectedPoints(2);
            }
        },
        clear: function() {
            var plotData = wpd.appData.getPlotData();
            plotData.distanceMeasurementData = new wpd.ConnectedPoints(2);
        },
        getData: function() {
            var plotData = wpd.appData.getPlotData();
            return plotData.distanceMeasurementData;
        }
    },
    angle: {
        name: 'angle',
        connectivity: 3,
        addButtonId: 'add-angle-button',
        deleteButtonId: 'delete-angle-button',
        sidebarId: 'measure-angles-sidebar',
        init: function() {
            var plotData = wpd.appData.getPlotData();
            if(plotData.angleMeasurementData == null) {
                plotData.angleMeasurementData = new wpd.ConnectedPoints(3);
            }
        },
        clear: function() {
            var plotData = wpd.appData.getPlotData();
            plotData.angleMeasurementData = new wpd.ConnectedPoints(3);
        },
        getData: function() {
            var plotData = wpd.appData.getPlotData();
            return plotData.angleMeasurementData;
        }
    },
    openPath: {
        name: 'open-path',
        connectivity: -1,
        addButtonId: 'add-open-path-button',
        deleteButtonId: 'delete-open-path-button',
        sidebarId: 'measure-open-path-sidebar',
        init: function() {
            var plotData = wpd.appData.getPlotData();
            if(plotData.openPathMeasurementData == null) {
                plotData.openPathMeasurementData = new wpd.ConnectedPoints();
            }
        },
        clear: function() {
            var plotData = wpd.appData.getPlotData();
            plotData.openPathMeasurementData = new wpd.ConnectedPoints();
        },
        getData: function() {
            var plotData = wpd.appData.getPlotData();
            return plotData.openPathMeasurementData;
        }
    },
    closedPath: {
        name: 'closed-path',
        connectivity: -1,
        addButtonId: 'add-closed-path-button',
        deleteButtonId: 'delete-closed-path-button',
        sidebarId: 'measure-closed-path-sidebar',
        init: function() {
            var plotData = wpd.appData.getPlotData();
            if(plotData.closedPathMeasurementData == null) {
                plotData.closedPathMeasurementData = new wpd.ConnectedPoints();
            }
        },
        clear: function() {
            var plotData = wpd.appData.getPlotData();
            plotData.closedPathMeasurementData = new wpd.ConnectedPoints();
        },
        getData: function() {
            var plotData = wpd.appData.getPlotData();
            return plotData.closedPathMeasurementData;
        }
    }
};

wpd.measurement = (function () {

    var activeMode;

    function start(mode) {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.resetData();
        mode.init();
        wpd.sidebar.show(mode.sidebarId);
        wpd.graphicsWidget.setTool(new wpd.AddMeasurementTool(mode));
        wpd.graphicsWidget.forceHandlerRepaint();
        activeMode = mode;
    }

    function addItem() {
        wpd.graphicsWidget.setTool(new wpd.AddMeasurementTool(activeMode));
    }

    function deleteItem() {
        wpd.graphicsWidget.setTool(new wpd.DeleteMeasurementTool(activeMode));
    }

    function clearAll() {
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.resetData();
        activeMode.clear();
    }

    return {
        start: start,
        addItem: addItem,
        deleteItem: deleteItem,
        clearAll: clearAll
    };
})();

wpd.AddMeasurementTool = (function () {
    var Tool = function (mode) {
        var ctx = wpd.graphicsWidget.getAllContexts(),
            pointsCaptured = 0,
            isCapturing = true,
            plist = [];

        this.onAttach = function () {
            document.getElementById(mode.addButtonId).classList.add('pressed-button');
            wpd.graphicsWidget.setRepainter(new wpd.MeasurementRepainter(mode));
        };

        this.onRemove = function () {
            document.getElementById(mode.addButtonId).classList.remove('pressed-button');
        };

        this.onKeyDown = function (ev) {
            // move the selected point or switch tools
            if(wpd.keyCodes.isAlphabet(ev.keyCode, 'a')) {
                wpd.graphicsWidget.resetHover();
                wpd.graphicsWidget.setTool(new wpd.AddMeasurementTool(mode));
                return;
            } else if (wpd.keyCodes.isAlphabet(ev.keyCode, 'd')) {
                wpd.graphicsWidget.resetHover();
                wpd.graphicsWidget.setTool(new wpd.DeleteMeasurementTool(mode));
                return;
            } else if ((wpd.keyCodes.isEnter(ev.keyCode) || wpd.keyCodes.isEsc(ev.keyCode)) 
                        && isCapturing === true && mode.connectivity < 0) {
                isCapturing = false;
                mode.getData().addConnection(plist);
                wpd.graphicsWidget.forceHandlerRepaint();
                wpd.graphicsWidget.setTool(new wpd.AdjustMeasurementTool(mode));
                return;
            }
        };


        this.onMouseClick = function (ev, pos, imagePos) {
            if(isCapturing) {

                wpd.graphicsWidget.resetHover();

                plist[pointsCaptured*2] = imagePos.x;
                plist[pointsCaptured*2 + 1] = imagePos.y;
                pointsCaptured = pointsCaptured + 1;

                if(pointsCaptured === mode.connectivity) {
                    isCapturing = false;
                    mode.getData().addConnection(plist);
                    wpd.graphicsWidget.forceHandlerRepaint();
                    wpd.graphicsWidget.setTool(new wpd.AdjustMeasurementTool(mode));
                    return;
                }

                if(pointsCaptured > 1) {
                    // draw line from previous point to current
                    var prevScreenPx = wpd.graphicsWidget.screenPx(plist[(pointsCaptured-2)*2], plist[(pointsCaptured-2)*2 + 1]);
                    ctx.dataCtx.beginPath();
                    ctx.dataCtx.strokeStyle = "rgb(0,0,10)";
                    ctx.dataCtx.moveTo(prevScreenPx.x, prevScreenPx.y);
                    ctx.dataCtx.lineTo(pos.x, pos.y);
                    ctx.dataCtx.stroke();

                    ctx.oriDataCtx.beginPath();
                    ctx.oriDataCtx.strokeStyle = "rgb(0,0,10)";
                    ctx.oriDataCtx.moveTo(plist[(pointsCaptured-2)*2], plist[(pointsCaptured-2)*2 + 1]);
                    ctx.oriDataCtx.lineTo(imagePos.x, imagePos.y);
                    ctx.oriDataCtx.stroke();
                }

                // draw current point
                ctx.dataCtx.beginPath();
                ctx.dataCtx.fillStyle = "rgb(200, 0, 0)";
                ctx.dataCtx.arc(pos.x, pos.y, 3, 0, 2.0*Math.PI, true);
                ctx.dataCtx.fill();

                ctx.oriDataCtx.beginPath();
    	    	ctx.oriDataCtx.fillStyle = "rgb(200,0,0)";
	        	ctx.oriDataCtx.arc(imagePos.x, imagePos.y, 3, 0, 2.0*Math.PI, true);
	    	    ctx.oriDataCtx.fill();

            }
            wpd.graphicsWidget.updateZoomOnEvent(ev); 
        };

        this.onMouseMove = function (ev, pos, imagePos) {
            if(isCapturing && pointsCaptured >= 1) {
                wpd.graphicsWidget.resetHover();
                var prevScreenPx = wpd.graphicsWidget.screenPx(plist[(pointsCaptured-1)*2], plist[(pointsCaptured-1)*2 + 1]);

                ctx.hoverCtx.beginPath();
                ctx.hoverCtx.strokeStyle = "rgb(0,0,0)";
                ctx.hoverCtx.moveTo(prevScreenPx.x, prevScreenPx.y);
                ctx.hoverCtx.lineTo(pos.x, pos.y);
                ctx.hoverCtx.stroke();
            }
        };

    };
    return Tool;
})();

wpd.DeleteMeasurementTool = (function () {
    var Tool = function (mode) {
        var ctx = wpd.graphicsWidget.getAllContexts(),
            plotData = wpd.appData.getPlotData();

        this.onAttach = function () {
            document.getElementById(mode.deleteButtonId).classList.add('pressed-button');
            wpd.graphicsWidget.setRepainter(new wpd.MeasurementRepainter(mode));
        };

        this.onRemove = function () {
            document.getElementById(mode.deleteButtonId).classList.remove('pressed-button');
        };
        
        this.onKeyDown = function (ev) {
            // move the selected point or switch tools
            if(wpd.keyCodes.isAlphabet(ev.keyCode, 'a')) {
                wpd.graphicsWidget.setTool(new wpd.AddMeasurementTool(mode));
                return;
            } else if (wpd.keyCodes.isAlphabet(ev.keyCode, 'd')) {
                wpd.graphicsWidget.setTool(new wpd.DeleteMeasurementTool(mode));
                return;
            }
        };

        this.onMouseClick = function (ev, pos, imagePos) {
            mode.getData().deleteNearestConnection(imagePos.x, imagePos.y);
            wpd.graphicsWidget.setTool(new wpd.AdjustMeasurementTool(mode));
            wpd.graphicsWidget.resetData();
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomOnEvent(ev);
        };

    };
    return Tool;
})();

wpd.AdjustMeasurementTool = (function () {
    var Tool = function (mode) {
        this.onAttach = function () {
            wpd.graphicsWidget.setRepainter(new wpd.MeasurementRepainter(mode));
        };

        this.onMouseClick = function (ev, pos, imagePos) {
            // select the nearest point
            mode.getData().selectNearestPoint(imagePos.x, imagePos.y);
            wpd.graphicsWidget.forceHandlerRepaint();
            wpd.graphicsWidget.updateZoomOnEvent(ev);
        };

        this.onKeyDown = function (ev) {
            // move the selected point or switch tools
            if(wpd.keyCodes.isAlphabet(ev.keyCode, 'a')) {
                wpd.graphicsWidget.setTool(new wpd.AddMeasurementTool(mode));
                return;
            } else if (wpd.keyCodes.isAlphabet(ev.keyCode, 'd')) {
                wpd.graphicsWidget.setTool(new wpd.DeleteMeasurementTool(mode));
                return;
            }

            var measurementData = mode.getData(),
                selectedPt = measurementData.getSelectedConnectionAndPoint();

            if(selectedPt.connectionIndex >= 0 && selectedPt.pointIndex >= 0) {

                var stepSize = ev.shiftKey === true ? 5/wpd.graphicsWidget.getZoomRatio() : 0.5/wpd.graphicsWidget.getZoomRatio(),
                    pointPx = measurementData.getPointAt(selectedPt.connectionIndex, selectedPt.pointIndex);

                if(wpd.keyCodes.isUp(ev.keyCode)) {
                    pointPx.y = pointPx.y - stepSize;
                } else if(wpd.keyCodes.isDown(ev.keyCode)) {
                    pointPx.y = pointPx.y + stepSize;
                } else if(wpd.keyCodes.isLeft(ev.keyCode)) {
                    pointPx.x = pointPx.x - stepSize;
                } else if(wpd.keyCodes.isRight(ev.keyCode)) {
                    pointPx.x = pointPx.x + stepSize;
                } else {
                    return;
                }
                
                measurementData.setPointAt(selectedPt.connectionIndex, selectedPt.pointIndex, pointPx.x, pointPx.y);
                wpd.graphicsWidget.forceHandlerRepaint();
                wpd.graphicsWidget.updateZoomToImagePosn(pointPx.x, pointPx.y);
                ev.preventDefault();
                ev.stopPropagation();
            }
        };
    };
    return Tool;
})();

wpd.MeasurementRepainter = (function () {
    var Painter = function (mode) {
        var ctx = wpd.graphicsWidget.getAllContexts(),

            drawLine = function(sx0, sy0, sx1, sy1, ix0, iy0, ix1, iy1) {

                ctx.dataCtx.beginPath();
                ctx.dataCtx.strokeStyle = "rgb(0,0,10)";
                ctx.dataCtx.moveTo(sx0, sy0);
                ctx.dataCtx.lineTo(sx1, sy1);
                ctx.dataCtx.stroke();

                ctx.oriDataCtx.beginPath();
                ctx.oriDataCtx.strokeStyle = "rgb(0,0,10)";
                ctx.oriDataCtx.moveTo(ix0, iy0);
                ctx.oriDataCtx.lineTo(ix1, iy1);
                ctx.oriDataCtx.stroke();

            },

            drawPoint = function(sx, sy, ix, iy, isSelected) {

                ctx.dataCtx.beginPath();
                if(isSelected) {
                    ctx.dataCtx.fillStyle = "rgb(0, 200, 0)";
                } else {
                    ctx.dataCtx.fillStyle = "rgb(200, 0, 0)";
                }
                ctx.dataCtx.arc(sx, sy, 3, 0, 2.0*Math.PI, true);
                ctx.dataCtx.fill();

                ctx.oriDataCtx.beginPath();
                if(isSelected) {
                    ctx.oriDataCtx.fillStyle = "rgb(0,200,0)";
                } else {
                    ctx.oriDataCtx.fillStyle = "rgb(200,0,0)";
                }
                ctx.oriDataCtx.arc(ix, iy, 3, 0, 2.0*Math.PI, true);
                ctx.oriDataCtx.fill();

            },

            drawArc = function(sx, sy, ix, iy, theta1, theta2) {
                ctx.dataCtx.beginPath();
                ctx.dataCtx.strokeStyle = "rgb(0,0,10)";
                ctx.dataCtx.arc(sx, sy, 15, theta1, theta2, true);
                ctx.dataCtx.stroke();

                ctx.oriDataCtx.beginPath();
                ctx.oriDataCtx.strokeStyle = "rgb(0,0,10)";
                ctx.oriDataCtx.arc(ix, iy, 15, theta1, theta2, true);
                ctx.oriDataCtx.stroke();
            },

            drawLabel = function(sx, sy, ix, iy, lab) {
                var labelWidth;
                
                sx = parseInt(sx, 10);
                sy = parseInt(sy, 10);
                ix = parseInt(ix, 10);
                iy = parseInt(iy, 10);

                ctx.dataCtx.font="14px sans-serif";
                labelWidth = ctx.dataCtx.measureText(lab).width;
                ctx.dataCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.dataCtx.fillRect(sx - 5, sy - 15, labelWidth + 10, 25);
                ctx.dataCtx.fillStyle = "rgb(200, 0, 0)";
                ctx.dataCtx.fillText(lab, sx, sy);

                ctx.oriDataCtx.font="14px sans-serif";
                labelWidth = ctx.oriDataCtx.measureText(lab).width;
                ctx.oriDataCtx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.oriDataCtx.fillRect(ix - 5, iy - 15, labelWidth + 10, 25);
                ctx.oriDataCtx.fillStyle = "rgb(200, 0, 0)";
                ctx.oriDataCtx.fillText(lab, ix, iy);
            },
            
            drawDistances = function () {
                var distData = wpd.appData.getPlotData().distanceMeasurementData,
                    conn_count = distData.connectionCount(),
                    conni,
                    plist,
                    x0, y0,
                    x1, y1,
                    spx0, spx1,
                    dist,
                    isSelected0, isSelected1,
                    axes = wpd.appData.getPlotData().axes;

                for(conni = 0; conni < conn_count; conni++) {
                    plist = distData.getConnectionAt(conni);
                    x0 = plist[0]; y0 = plist[1]; x1 = plist[2]; y1 = plist[3];
                    isSelected0 = distData.isPointSelected(conni, 0);
                    isSelected1 = distData.isPointSelected(conni, 1);
                    if(wpd.appData.isAligned() === true && axes instanceof wpd.MapAxes) {
                        dist = 'Dist' + conni.toString() + ': ' + axes.pixelToDataDistance(distData.getDistance(conni)).toFixed(2) + ' ' + axes.getUnits();
                    } else {
                        dist = 'Dist' + conni.toString() + ': ' + distData.getDistance(conni).toFixed(2) + ' px';
                    }
                    spx0 = wpd.graphicsWidget.screenPx(x0, y0);
                    spx1 = wpd.graphicsWidget.screenPx(x1, y1);

                    // draw connecting lines:
                    drawLine(spx0.x, spx0.y, spx1.x, spx1.y, x0, y0, x1, y1);
                    
                    // draw data points:
                    drawPoint(spx0.x, spx0.y, x0, y0, isSelected0);
                    drawPoint(spx1.x, spx1.y, x1, y1, isSelected1);
                    
                    // distance label
                    drawLabel(0.5*(spx0.x + spx1.x), 0.5*(spx0.y + spx1.y), 0.5*(x0 + x1), 0.5*(y0 + y1), dist);
                }
            },
            
            drawAngles = function () {
                var angleData = wpd.appData.getPlotData().angleMeasurementData,
                    conn_count = angleData.connectionCount(),
                    conni,
                    plist,
                    x0, y0, x1, y1, x2, y2,
                    spx0, spx1, spx2,
                    theta1, theta2, theta,
                    isSelected0, isSelected1, isSelected2;
                for(conni = 0; conni < conn_count; conni++) {
                    plist = angleData.getConnectionAt(conni);
                    x0 = plist[0]; y0 = plist[1]; x1 = plist[2]; y1 = plist[3]; x2 = plist[4]; y2 = plist[5];
                    isSelected0 = angleData.isPointSelected(conni, 0);
                    isSelected1 = angleData.isPointSelected(conni, 1);
                    isSelected2 = angleData.isPointSelected(conni, 2);
                    theta = 'Theta' + conni.toString() + ': ' + angleData.getAngle(conni).toFixed(2) + '°';
                    theta1 = Math.atan2((y0 - y1), x0 - x1);
                    theta2 = Math.atan2((y2 - y1), x2 - x1);
                    spx0 = wpd.graphicsWidget.screenPx(x0, y0);
                    spx1 = wpd.graphicsWidget.screenPx(x1, y1);
                    spx2 = wpd.graphicsWidget.screenPx(x2, y2);

                    // draw connecting lines:
                    drawLine(spx0.x, spx0.y, spx1.x, spx1.y, x0, y0, x1, y1);
                    drawLine(spx1.x, spx1.y, spx2.x, spx2.y, x1, y1, x2, y2);

                    // draw data points:
                    drawPoint(spx0.x, spx0.y, x0, y0, isSelected0);
                    drawPoint(spx1.x, spx1.y, x1, y1, isSelected1);
                    drawPoint(spx2.x, spx2.y, x2, y2, isSelected2);

                    // draw angle arc:
                    drawArc(spx1.x, spx1.y, x1, y1, theta1, theta2);

                    // angle label
                    drawLabel(spx1.x + 10, spx1.y + 15, x1 + 10, y1 + 15, theta);
                    
                }
            };

        this.painterName = 'measurementRepainter-'+mode.name;

        this.onAttach = function () {
            wpd.graphicsWidget.resetData();
        };

        this.onRedraw = function () {
            if(mode.name === wpd.measurementModes.distance.name) {
                drawDistances();
            } else if(mode.name === wpd.measurementModes.angle.name) {
                drawAngles();
            }
        };

        this.onForcedRedraw = function () {
            wpd.graphicsWidget.resetData();
            this.onRedraw();
        };
    };
    return Painter;
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

wpd = wpd || {};

wpd.perspective = (function () {

    function start() {

        // Clear current graphics and detach tools
        wpd.graphicsWidget.removeTool();
        wpd.graphicsWidget.removeRepainter();
        wpd.graphicsWidget.resetData();

        // Display dialog box with instructions
        wpd.popup.show('perspective-info');
    }

    // called when clicked 'ok' on dialog box
    function pickCorners() { 
    }

    // called when clicked 'run' on sidebar
    function run() {
    }

    // called when clicked 'reset' on sidebar
    function revert() {
    }

    return {
        start: start,
        pickCorners: pickCorners,
        run: run,
        revert: revert
    };
})();

wpd.perspectiveCornersRepainter = function () {
    this.painterName = 'perspectiveCornersRepainter';

    this.onRedraw = function() {

    };
};

wpd.perspectiveCornersTool = function () {
    this.onAttach = function () {
    };

    this.onMouseDown = function () {
    };

    this.onRemove = function () {
    };
};
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// Very simple GET/POST methods.
wpd.ajax = (function() {

    function get(url, responseHandler) {
        if(responseHandler != null) {
            var oReq = new XMLHttpRequest();
            oReq.onload = function(e) {
                if(this.status === 200) {
                    responseHandler(oReq);
                }
            };
            oReq.open("GET", url, true);
            oReq.send();
        }
    }

    function post(url, data, responseHandler) {
        if(responseHandler != null) {
            var oReq = new XMLHttpRequest();
            oReq.onload = function(e) {
                if(this.status === 200) {
                    responseHandler(oReq);
                }
            };
            oReq.open("POST", url, true);
            oReq.setRequestHeader('Content-type', 'application/json');
            oReq.send(data);
        }
    }

    return {
        get: get,
        post: post
    };

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.args = (function() {

    // Simple argument parser
    // e.g. 
    // if WPD is launched as http://localhost:8000/index.html?q=1
    // then getValue('q') should return '1'
    // and getValue('nonexistent') should return null
    function getValue(arg) {

        var searchString = window.location.search.substring(1),
            i,
            val,
            params = searchString.split("&");

        for(i = 0; i < params.length; i++) {
            val = params[i].split("=");
            if(val[0] === arg) {
                return unescape(val[1]);
            }
        }
        return null;

    }

    return {
        getValue: getValue
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.dataExport = (function () {

    function show() {
        // open dialog box explaining data format
    }

    function getValueAtPixel(ptIndex, axes, pixel) {
        var val = axes.pixelToData(pixel.x, pixel.y);
        if(axes instanceof wpd.XYAxes) {
            for(var i = 0; i <= 1; i++) {
                if(axes.isDate(i)) {
                    var dformat = axes.getInitialDateFormat(i);                
                    val[i] = wpd.dateConverter.formatDateNumber(val[i], dformat);
                }
            }
        } else if(axes instanceof wpd.BarAxes) {
            val = ['', val[0]];
            if(pixel.metadata == null) {
                val[0] = "Bar" + ptIndex;
            } else {
                val[0] = pixel.metadata[0];
            }            
        }
        return val;
    }

    function generateCSV() {
        wpd.popup.close('export-all-data-popup');
        // generate file and trigger download

        // loop over all datasets
        var plotData = wpd.appData.getPlotData(),
            axes = plotData.axes,
            dsColl = plotData.dataSeriesColl,
            i, j;

        if(axes == null || dsColl == null || dsColl.length === 0) {
            // axes is not aligned, show an error message?
            wpd.messagePopup.show(wpd.gettext('no-datasets-to-export-error'), wpd.gettext('no-datasets-to-export'));
            return;
        }

        var axLab = axes.getAxesLabels(),
            axdims = axLab.length,
            numCols = dsColl.length*axdims,
            maxDatapts = 0,
            pts,
            header = [],
            varheader = [],
            valData = [];
        
        for(i = 0; i < dsColl.length; i++) {
            pts = dsColl[i].getCount();
            if(pts > maxDatapts) {
                maxDatapts = pts;
            }
            header.push(dsColl[i].name);
            for(j = 0; j < axdims; j++) {
                if(j !== 0) {
                    header.push('');
                }
                varheader.push(axLab[j]);
            }
        }
        for(i = 0; i < maxDatapts; i++) {
            var valRow = [];
            for(j = 0; j < numCols; j++) {
                valRow.push('');
            }
            valData.push(valRow);
        }

        for(i = 0; i < dsColl.length; i++) {
            pts = dsColl[i].getCount();
            for(j = 0; j < pts; j++) {
                var px = dsColl[i].getPixel(j);
                var val = getValueAtPixel(j, axes, px);
                var di;
                for(di = 0; di < axdims; di++) {
                    valData[j][i*axdims + di] = val[di];
                }
            }
        }

        var csvText = header.join(',') + '\n' + varheader.join(',') + '\n';
        for(i = 0; i < maxDatapts; i++) {
            csvText += valData[i].join(',') + '\n';
        }
        
        // download
        wpd.download.csv(JSON.stringify(csvText), "wpd_datasets");
    }

    function exportToPlotly() {
        wpd.popup.close('export-all-data-popup');

        // loop over all datasets
        var plotData = wpd.appData.getPlotData(),
            axes = plotData.axes,
            dsColl = plotData.dataSeriesColl,
            i, coli, rowi,
            dataProvider = wpd.plotDataProvider,
            pdata,
            plotlyData = { "data": [] },
            colName;

        if(axes == null || dsColl == null || dsColl.length === 0) {
            // axes is not aligned, show an error message?
            wpd.messagePopup.show(wpd.gettext('no-datasets-to-export-error'), wpd.gettext('no-datasets-to-export'));
            return;
        }

        for(i = 0; i < dsColl.length; i++) {
            dataProvider.setDatasetIndex(i);
            pdata = dataProvider.getData();
            plotlyData.data[i] = {};

            // loop over columns
            for(coli = 0; coli < 2; coli++) {
                colName = (coli === 0) ? 'x' : 'y';
                plotlyData.data[i][colName] = [];
                for(rowi = 0; rowi < pdata.rawData.length; rowi++) {
                    if(pdata.fieldDateFormat[coli] != null) {
                        plotlyData.data[i][colName][rowi] = wpd.dateConverter(pdata.rawData[rowi][coli], "yyyy-mm-dd");
                    } else {
                        plotlyData.data[i][colName][rowi] = pdata.rawData[rowi][coli];
                    }
                }
            }
        }

        wpd.plotly.send(plotlyData);
    }

    return {
        show: show,
        generateCSV: generateCSV,
        exportToPlotly: exportToPlotly
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.download = (function() {
    
    function textFile(data, filename, format) {
        var formContainer,
            formElement,
            formData,
            formFilename,
            jsonData = data;
        
        // Create a hidden form and submit
        formContainer = document.createElement('div');
        formElement = document.createElement('form');
        formData = document.createElement('textarea');
        formFilename = document.createElement('input');
        formFilename.type = 'hidden';

        formElement.setAttribute('method', 'post');

        if(format === 'json') {
            formElement.setAttribute('action', 'php/json.php');
        } else if (format === 'csv') {
            formElement.setAttribute('action', 'php/csvexport.php');
        }

        formData.setAttribute('name', "data");
        formData.setAttribute('id', "data");
        formFilename.setAttribute('name', 'filename');
        formFilename.setAttribute('id', 'filename');
        formFilename.value = stripIllegalCharacters(filename);

        formElement.appendChild(formData);
        formElement.appendChild(formFilename);
        formContainer.appendChild(formElement);
        document.body.appendChild(formContainer);
        formContainer.style.display = 'none';

        formData.innerHTML = jsonData;
        formElement.submit();
        document.body.removeChild(formContainer);
    }

    function json(jsonData, filename) {
        if(filename == null) {
            filename = 'wpd_plot_data';
        }
        textFile(jsonData, filename, 'json');
    }

    function csv(csvData, filename) {
        if(filename == null) {
            filename = 'data';
        }
        textFile(csvData, filename, 'csv');
    }

    function stripIllegalCharacters(filename) {
        return filename.replace(/[^a-zA-Z\d+\.\-_\s]/g,"_");
    }

    return {
        json: json,
        csv: csv
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.gettext = function(stringId) {
    var $str = document.getElementById('i18n-string-' + stringId);
    if($str) {
        return $str.innerHTML;
    }
    return 'i18n string';
};
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.plotly = (function() {
    
    function send(dataObject) {
        var formContainer = document.createElement('div'),
            formElement = document.createElement('form'),
            formData = document.createElement('textarea'),
            jsonString;

        formElement.setAttribute('method', 'post');
        formElement.setAttribute('action', 'https://plot.ly/external');
        formElement.setAttribute('target', '_blank');
        
        formData.setAttribute('name', 'data');
        formData.setAttribute('id', 'data');

        formElement.appendChild(formData);
        formContainer.appendChild(formElement);
        document.body.appendChild(formContainer);
        formContainer.style.display = 'none';

        jsonString = JSON.stringify(dataObject);
        
        formData.innerHTML = jsonString;
        formElement.submit();
        document.body.removeChild(formContainer);
    }

    return {
        send: send
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.saveResume = (function () {

    function save() {
        wpd.popup.show('export-json-window');
    }

    function load() {
        wpd.popup.show('import-json-window');
    }

    function resumeFromJSON(json_data) {
       var plotData = wpd.appData.getPlotData(),
           rdata = json_data.wpd,
           calib,
           i, j, ds, currDataset;

       plotData.reset();
       wpd.appData.isAligned(false);
        
       if(rdata.axesType == null) {
           return;
       }

       if(rdata.axesType !== 'ImageAxes' 
           && (rdata.calibration == null || rdata.axesParameters == null)) {
           return;
       }

       if(rdata.axesType !== 'ImageAxes') {
           if(rdata.axesType === 'TernaryAxes') {
               calib = new wpd.Calibration(3);
           } else {
               calib = new wpd.Calibration(2);
           }
           for(i = 0; i < rdata.calibration.length; i++) {
               calib.addPoint(rdata.calibration[i].px,
                              rdata.calibration[i].py,
                              rdata.calibration[i].dx,
                              rdata.calibration[i].dy,
                              rdata.calibration[i].dz);

           }
           plotData.calibration = calib;
       }

       if(rdata.axesType === 'XYAxes') {
           plotData.axes = new wpd.XYAxes();
           if(!plotData.axes.calibrate(plotData.calibration, 
                                       rdata.axesParameters.isLogX,
                                       rdata.axesParameters.isLogY)) {
               return;
           }
       } else if (rdata.axesType === 'BarAxes') {
           plotData.axes = new wpd.BarAxes();
           if(!plotData.axes.calibrate(plotData.calibration, rdata.axesParameters.isLog)) {
               return;
           }
       } else if (rdata.axesType === 'PolarAxes') {
           plotData.axes = new wpd.PolarAxes();
           if(!plotData.axes.calibrate(plotData.calibration,
                                      rdata.axesParameters.isDegrees,
                                      rdata.axesParameters.isClockwise)) {
               return;
           }
       } else if(rdata.axesType === 'TernaryAxes') {
           plotData.axes = new wpd.TernaryAxes();
           if(!plotData.axes.calibrate(plotData.calibration,
                                      rdata.axesParameters.isRange100,
                                      rdata.axesParameters.isNormalOrientation)) {
               return;
           }
       } else if(rdata.axesType === 'MapAxes') {
           plotData.axes = new wpd.MapAxes();
           if(!plotData.axes.calibrate(plotData.calibration,
                                      rdata.axesParameters.scaleLength,
                                      rdata.axesParameters.unitString)) {
               return;
           }
       } else if(rdata.axesType === 'ImageAxes') {
           plotData.axes = new wpd.ImageAxes();
       }

       wpd.appData.isAligned(true);
       
       if(rdata.dataSeries == null) {
           return;
       }

       for(i = 0; i < rdata.dataSeries.length; i++) {
           ds = rdata.dataSeries[i];
           plotData.dataSeriesColl[i] = new wpd.DataSeries();
           currDataset = plotData.dataSeriesColl[i];
           currDataset.name = ds.name;
           if(ds.metadataKeys != null) {
               currDataset.setMetadataKeys(ds.metadataKeys);
           }
           for(j = 0; j < ds.data.length; j++) {
               currDataset.addPixel(ds.data[j].x, ds.data[j].y, ds.data[j].metadata);
           }
       }

       if(rdata.distanceMeasurementData != null) {
           plotData.distanceMeasurementData = new wpd.ConnectedPoints(2);
           for(i = 0; i < rdata.distanceMeasurementData.length; i++) {
               plotData.distanceMeasurementData.addConnection(rdata.distanceMeasurementData[i]);
           }
       }

       if(rdata.angleMeasurementData != null) {
           plotData.angleMeasurementData = new wpd.ConnectedPoints(3);
           for(i = 0; i < rdata.angleMeasurementData.length; i++) {
               plotData.angleMeasurementData.addConnection(rdata.angleMeasurementData[i]);
           }
       }


    }

    function generateJSON() {
        var plotData = wpd.appData.getPlotData(),
            calibration = plotData.calibration,
            outData = {
                    wpd: {
                        version: [3, 8], // [major, minor, subminor,...]
                        axesType: null,
                        axesParameters: null,
                        calibration: null,
                        dataSeries: [],
                        distanceMeasurementData: null,
                        angleMeasurementData: null
                    }
                },
            json_string = '',
            i,j,
            ds,
            pixel,
            mkeys;
        
        if(calibration != null) {
            outData.wpd.calibration = [];
            for(i = 0; i < calibration.getCount(); i++) {
                outData.wpd.calibration[i] = calibration.getPoint(i);
            }
        }

        if(plotData.axes != null) {
            if(plotData.axes instanceof wpd.XYAxes) {
                outData.wpd.axesType = 'XYAxes';
                outData.wpd.axesParameters = {
                    isLogX: plotData.axes.isLogX(),
                    isLogY: plotData.axes.isLogY()
                };
            } else if(plotData.axes instanceof wpd.BarAxes) {
                outData.wpd.axesType = 'BarAxes';
                outData.wpd.axesParameters = {
                    isLog: plotData.axes.isLog()
                };
            } else if(plotData.axes instanceof wpd.PolarAxes) {
                outData.wpd.axesType = 'PolarAxes';
                outData.wpd.axesParameters = {
                    isDegrees: plotData.axes.isThetaDegrees(),
                    isClockwise: plotData.axes.isThetaClockwise()
                };
            } else if(plotData.axes instanceof wpd.TernaryAxes) {
                outData.wpd.axesType = 'TernaryAxes';
                outData.wpd.axesParameters = {
                    isRange100: plotData.axes.isRange100(),
                    isNormalOrientation: plotData.axes.isNormalOrientation()
                };
            } else if(plotData.axes instanceof wpd.MapAxes) {
                outData.wpd.axesType = 'MapAxes';
                outData.wpd.axesParameters = {
                    scaleLength: plotData.axes.getScaleLength(),
                    unitString: plotData.axes.getUnits() 
                };
            } else if(plotData.axes instanceof wpd.ImageAxes) {
                outData.wpd.axesType = 'ImageAxes';
            }
        }

        for(i = 0; i < plotData.dataSeriesColl.length; i++) {
            ds = plotData.dataSeriesColl[i];
            outData.wpd.dataSeries[i] = {
                name: ds.name,
                data: []
            };
            mkeys = ds.getMetadataKeys();
            if(mkeys != null) {
                outData.wpd.dataSeries[i].metadataKeys = mkeys;
            }
            for(j = 0; j < ds.getCount(); j++) {
                pixel = ds.getPixel(j);
                outData.wpd.dataSeries[i].data[j] = pixel;
                outData.wpd.dataSeries[i].data[j].value = plotData.axes.pixelToData(pixel.x, pixel.y);
            }
        }

        if (plotData.distanceMeasurementData != null) {
            outData.wpd.distanceMeasurementData = [];
            for(i = 0; i < plotData.distanceMeasurementData.connectionCount(); i++) {
                outData.wpd.distanceMeasurementData[i] = plotData.distanceMeasurementData.getConnectionAt(i);
            }
        }
        if(plotData.angleMeasurementData != null) {
            outData.wpd.angleMeasurementData = [];
            for(i = 0; i < plotData.angleMeasurementData.connectionCount(); i++) {
                outData.wpd.angleMeasurementData[i] = plotData.angleMeasurementData.getConnectionAt(i);
            }
        }

        json_string = JSON.stringify(outData);
        return json_string;
    }

    function download() {
        wpd.download.json(generateJSON()); 
        wpd.popup.close('export-json-window');
    }

    function read() {
        var $fileInput = document.getElementById('import-json-file');
        wpd.popup.close('import-json-window');
        if($fileInput.files.length === 1) {
            var fileReader = new FileReader();
            fileReader.onload = function () {
                var json_data = JSON.parse(fileReader.result);
                resumeFromJSON(json_data); 
                
                wpd.graphicsWidget.resetData();
                wpd.graphicsWidget.removeTool();
                wpd.graphicsWidget.removeRepainter();
                if(wpd.appData.isAligned()) {
                    wpd.acquireData.load();
                }
                wpd.messagePopup.show(wpd.gettext('import-json'), wpd.gettext("json-data-loaded"));
            };
            fileReader.readAsText($fileInput.files[0]);
        }
    }

    return {
        save: save,
        load: load,
        download: download,
        read: read,
        generateJSON: generateJSON,
        resumeFromJSON: resumeFromJSON
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

wpd.scriptInjector = (function () {
    
    function start() {
        wpd.popup.show('runScriptPopup');
    }

    function cancel() {
        wpd.popup.close('runScriptPopup');
    }

    function load() {
        var $scriptFileInput = document.getElementById('runScriptFileInput');
        wpd.popup.close('runScriptPopup');
        if($scriptFileInput.files.length == 1) {
            var fileReader = new FileReader();
            fileReader.onload = function() {
                if(typeof wpdscript !== "undefined") {
                    delete wpdscript;
                }
                eval(fileReader.result);
                if(typeof wpdscript !== "wpdscript") {
                    window["wpdscript"] = wpdscript;
                    wpdscript.run();
                }
            };
            fileReader.readAsText($scriptFileInput.files[0]);
        }
    }

    function injectHTML() {
    }

    function injectCSS() {
    }

    return {
        start: start,
        cancel: cancel,
        load: load
    };
})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};

// Handle WebSocket Communication
wpd.websocket = (function () {

    var ws,
        isConnected,
        requestCallbacks = {};

    function connect(address) {
        ws = new WebSocket(address);
        ws.onopen = onOpen;
        ws.onmessage = onMessage;
        ws.onclose = onClose;
    }

    function onOpen() {
        isConnected = true;
    }

    function onClose() {
        isConnected = false;
        requestCallbacks = {};
    }

    function onMessage(evt) {
        if (evt.data != null) {
            console.log(evt.data); // just for debugging
            var messageObject = JSON.parse(evt.data);
            if (messageObject != null) {
                // TODO: handle notifications and requests from the server.
                var callbackData = requestCallbacks[messageObject.timestamp];
                if (callbackData != null && callbackData.requestId === messageObject.id) {
                    callbackData.callback(messageObject.message);
                    delete requestCallbacks[messageObject.timestamp];
                }
            } else {
                // Unknown message
                alert("Server announcement: " + messageObject);
                console.log(messageObject);
            }
        }
    }

    function sendMessage(msg) {
        if (isConnected) {
            console.log(msg);
            ws.send(msg);
        }
    }

    function registerRequest(requestId, callback) {
    }

    function registerNotification(notificationId, callback) {
    }

    function request(requestId, messageObject, callback) {
        var timestamp = Date.now(),
            jsonString = JSON.stringify({"type": "request",
                                         "timestamp": timestamp,
                                         "id": requestId,
                                         "message": messageObject});
        requestCallbacks[timestamp] = {
            "requestId": requestId,
            "callback": callback
        };

        sendMessage(jsonString);
    }

    function notify(notificationId, messageObject) {
        var timestamp = Date.now(),
            jsonString = JSON.stringify({"type": "notification",
                                         "timestamp": timestamp,
                                         "id": notificationId,
                                         "message": messageObject});
        sendMessage(jsonString);
    }

    return {
        connect: connect,
        registerRequest: registerRequest,
        registerNotification: registerNotification,
        request: request,
        notify: notify
    };

})();
/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotdigitizer

	Copyright 2010-2017 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDIgitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

// browserInfo.js - browser and available HTML5 feature detection
var wpd = wpd || {};
wpd.browserInfo = (function () {

    function checkBrowser() {
        if(!window.FileReader) {
            alert('\tWARNING!\nYour web browser is not supported. This program might not behave as intended. Please use a recent version of Google Chrome, Firefox or Safari browser.');
        }
    }

    return {
        checkBrowser : checkBrowser
    };
})();

/*! Build Number: 2.2.0 */
!function(t){function e(o){if(i[o])return i[o].exports;var n=i[o]={exports:{},id:o,loaded:!1};return t[o].call(n.exports,n,n.exports,e),n.loaded=!0,n.exports}var i={};return e.m=t,e.c=i,e.p="",e(0)}([function(t,e,i){var o=i(19);o.init()},function(t,e,i){function o(){var t=c.get(s);return t}function n(t){var e=t.join(l);console.log("Saving approved origins '"+e+"'");var i=c.set(s,e);return i}function a(t){if(t){var e=r();e.push(t),n(e)}}function r(){var t=o();if(!t||0===t.length)return[];var e=t.split(l);return e}var s="wdc_approved_origins",l=",",c=i(8);t.exports.addApprovedOrigin=a,t.exports.getApprovedOrigins=r},function(t,e){function i(t){for(var e in o)t[e]=o[e]}var o={phaseEnum:{interactivePhase:"interactive",authPhase:"auth",gatherDataPhase:"gatherData"},authPurposeEnum:{ephemeral:"ephemeral",enduring:"enduring"},authTypeEnum:{none:"none",basic:"basic",custom:"custom"},dataTypeEnum:{bool:"bool",date:"date",datetime:"datetime",float:"float",int:"int",string:"string"},columnRoleEnum:{dimension:"dimension",measure:"measure"},columnTypeEnum:{continuous:"continuous",discrete:"discrete"},aggTypeEnum:{sum:"sum",avg:"avg",median:"median",count:"count",countd:"count_dist"},geographicRoleEnum:{area_code:"area_code",cbsa_msa:"cbsa_msa",city:"city",congressional_district:"congressional_district",country_region:"country_region",county:"county",state_province:"state_province",zip_code_postcode:"zip_code_postcode",latitude:"latitude",longitude:"longitude"},unitsFormatEnum:{thousands:"thousands",millions:"millions",billions_english:"billions_english",billions_standard:"billions_standard"},numberFormatEnum:{number:"number",currency:"currency",scientific:"scientific",percentage:"percentage"},localeEnum:{america:"en-us",brazil:"pt-br",china:"zh-cn",france:"fr-fr",germany:"de-de",japan:"ja-jp",korea:"ko-kr",spain:"es-es"},joinEnum:{inner:"inner",left:"left"}};t.exports.apply=i},function(t,e){function i(t){this.nativeApiRootObj=t,this._initPublicInterface(),this._initPrivateInterface()}i.prototype._initPublicInterface=function(){console.log("Initializing public interface for NativeDispatcher"),this._submitCalled=!1;var t={};t.abortForAuth=this._abortForAuth.bind(this),t.abortWithError=this._abortWithError.bind(this),t.addCrossOriginException=this._addCrossOriginException.bind(this),t.log=this._log.bind(this),t.submit=this._submit.bind(this),t.reportProgress=this._reportProgress.bind(this),this.publicInterface=t},i.prototype._abortForAuth=function(t){this.nativeApiRootObj.WDCBridge_Api_abortForAuth.api(t)},i.prototype._abortWithError=function(t){this.nativeApiRootObj.WDCBridge_Api_abortWithError.api(t)},i.prototype._addCrossOriginException=function(t){this.nativeApiRootObj.WDCBridge_Api_addCrossOriginException.api(t)},i.prototype._log=function(t){this.nativeApiRootObj.WDCBridge_Api_log.api(t)},i.prototype._submit=function(){return this._submitCalled?void console.log("submit called more than once"):(this._submitCalled=!0,void this.nativeApiRootObj.WDCBridge_Api_submit.api())},i.prototype._initPrivateInterface=function(){console.log("Initializing private interface for NativeDispatcher"),this._initCallbackCalled=!1,this._shutdownCallbackCalled=!1;var t={};t._initCallback=this._initCallback.bind(this),t._shutdownCallback=this._shutdownCallback.bind(this),t._schemaCallback=this._schemaCallback.bind(this),t._tableDataCallback=this._tableDataCallback.bind(this),t._dataDoneCallback=this._dataDoneCallback.bind(this),this.privateInterface=t},i.prototype._initCallback=function(){return this._initCallbackCalled?void console.log("initCallback called more than once"):(this._initCallbackCalled=!0,void this.nativeApiRootObj.WDCBridge_Api_initCallback.api())},i.prototype._shutdownCallback=function(){return this._shutdownCallbackCalled?void console.log("shutdownCallback called more than once"):(this._shutdownCallbackCalled=!0,void this.nativeApiRootObj.WDCBridge_Api_shutdownCallback.api())},i.prototype._schemaCallback=function(t,e){this.nativeApiRootObj.WDCBridge_Api_schemaCallbackEx?this.nativeApiRootObj.WDCBridge_Api_schemaCallbackEx.api(t,e||[]):this.nativeApiRootObj.WDCBridge_Api_schemaCallback.api(t)},i.prototype._tableDataCallback=function(t,e){this.nativeApiRootObj.WDCBridge_Api_tableDataCallback.api(t,e)},i.prototype._reportProgress=function(t){this.nativeApiRootObj.WDCBridge_Api_reportProgress?this.nativeApiRootObj.WDCBridge_Api_reportProgress.api(t):console.log("reportProgress not available from this Tableau version")},i.prototype._dataDoneCallback=function(){this.nativeApiRootObj.WDCBridge_Api_dataDoneCallback.api()},t.exports=i},function(t,e,i){function o(t,e,i){this.privateApiObj=e,this.globalObj=i,this._hasAlreadyThrownErrorSoDontThrowAgain=!1,this.changeTableauApiObj(t)}var n=i(6),a=i(2);o.prototype.init=function(){console.log("Initializing shared WDC"),this.globalObj.onerror=this._errorHandler.bind(this),this._initTriggerFunctions(),this._initDeprecatedFunctions()},o.prototype.changeTableauApiObj=function(t){this.tableauApiObj=t,this.tableauApiObj.makeConnector=this._makeConnector.bind(this),this.tableauApiObj.registerConnector=this._registerConnector.bind(this),a.apply(this.tableauApiObj)},o.prototype._errorHandler=function(t,e,i,o,n){if(console.error(n),this._hasAlreadyThrownErrorSoDontThrowAgain)return!0;var a=t;if(n?a+="   stack:"+n.stack:(a+="   file: "+e,a+="   line: "+i),!this.tableauApiObj||!this.tableauApiObj.abortWithError)throw a;return this.tableauApiObj.abortWithError(a),this._hasAlreadyThrownErrorSoDontThrowAgain=!0,!0},o.prototype._makeConnector=function(){var t={init:function(t){t()},shutdown:function(t){t()}};return t},o.prototype._registerConnector=function(t){for(var e=["init","shutdown","getSchema","getData"],i=e.length-1;i>=0;i--)if("function"!=typeof t[e[i]])throw"The connector did not define the required function: "+e[i];console.log("Connector registered"),this.globalObj._wdc=t,this._wdc=t},o.prototype._initTriggerFunctions=function(){this.privateApiObj.triggerInitialization=this._triggerInitialization.bind(this),this.privateApiObj.triggerSchemaGathering=this._triggerSchemaGathering.bind(this),this.privateApiObj.triggerDataGathering=this._triggerDataGathering.bind(this),this.privateApiObj.triggerShutdown=this._triggerShutdown.bind(this)},o.prototype._triggerInitialization=function(){this._wdc.init(this.privateApiObj._initCallback)},o.prototype._triggerSchemaGathering=function(){this._wdc.getSchema(this.privateApiObj._schemaCallback)},o.prototype._triggerDataGathering=function(t){if(1!=t.length)throw"Unexpected number of tables specified. Expected 1, actual "+t.length.toString();var e=t[0],i=!!e.filterColumnId,o=new n(e.tableInfo,e.incrementValue,i,e.filterColumnId||"",e.filterValues||[],this.privateApiObj._tableDataCallback);this._wdc.getData(o,this.privateApiObj._dataDoneCallback)},o.prototype._triggerShutdown=function(){this._wdc.shutdown(this.privateApiObj._shutdownCallback)},o.prototype._initDeprecatedFunctions=function(){this.tableauApiObj.initCallback=this._initCallback.bind(this),this.tableauApiObj.headersCallback=this._headersCallback.bind(this),this.tableauApiObj.dataCallback=this._dataCallback.bind(this),this.tableauApiObj.shutdownCallback=this._shutdownCallback.bind(this)},o.prototype._initCallback=function(){this.tableauApiObj.abortWithError("tableau.initCallback has been deprecated in version 2.0.0. Please use the callback function passed to init")},o.prototype._headersCallback=function(t,e){this.tableauApiObj.abortWithError("tableau.headersCallback has been deprecated in version 2.0.0")},o.prototype._dataCallback=function(t,e,i){this.tableauApiObj.abortWithError("tableau.dataCallback has been deprecated in version 2.0.0")},o.prototype._shutdownCallback=function(){this.tableauApiObj.abortWithError("tableau.shutdownCallback has been deprecated in version 2.0.0. Please use the callback function passed to shutdown")},t.exports=o},function(t,e,i){function o(t){this.globalObj=t,this._initMessageHandling(),this._initPublicInterface(),this._initPrivateInterface()}var n=i(1);o.prototype._initMessageHandling=function(){console.log("Initializing message handling"),this.globalObj.addEventListener("message",this._receiveMessage.bind(this),!1),this.globalObj.document.addEventListener("DOMContentLoaded",this._onDomContentLoaded.bind(this))},o.prototype._onDomContentLoaded=function(){if(this.globalObj.parent!==window&&this.globalObj.parent.postMessage(this._buildMessagePayload("loaded"),"*"),this.globalObj.opener)try{this.globalObj.opener.postMessage(this._buildMessagePayload("loaded"),"*")}catch(t){console.warn("Some versions of IE may not accurately simulate the Web Data Connector. Please retry on a Webkit based browser")}},o.prototype._packagePropertyValues=function(){var t={connectionName:this.globalObj.tableau.connectionName,connectionData:this.globalObj.tableau.connectionData,password:this.globalObj.tableau.password,username:this.globalObj.tableau.username,usernameAlias:this.globalObj.tableau.usernameAlias,incrementalExtractColumn:this.globalObj.tableau.incrementalExtractColumn,versionNumber:this.globalObj.tableau.versionNumber,locale:this.globalObj.tableau.locale,authPurpose:this.globalObj.tableau.authPurpose,platformOS:this.globalObj.tableau.platformOS,platformVersion:this.globalObj.tableau.platformVersion,platformEdition:this.globalObj.tableau.platformEdition,platformBuildNumber:this.globalObj.tableau.platformBuildNumber};return t},o.prototype._applyPropertyValues=function(t){t&&(this.globalObj.tableau.connectionName=t.connectionName,this.globalObj.tableau.connectionData=t.connectionData,this.globalObj.tableau.password=t.password,this.globalObj.tableau.username=t.username,this.globalObj.tableau.usernameAlias=t.usernameAlias,this.globalObj.tableau.incrementalExtractColumn=t.incrementalExtractColumn,this.globalObj.tableau.locale=t.locale,this.globalObj.tableau.language=t.locale,this.globalObj.tableau.authPurpose=t.authPurpose,this.globalObj.tableau.platformOS=t.platformOS,this.globalObj.tableau.platformVersion=t.platformVersion,this.globalObj.tableau.platformEdition=t.platformEdition,this.globalObj.tableau.platformBuildNumber=t.platformBuildNumber)},o.prototype._buildMessagePayload=function(t,e,i){var o={msgName:t,msgData:e,props:i,version:"2.2.0"};return JSON.stringify(o)},o.prototype._sendMessage=function(t,e){var i=this._buildMessagePayload(t,e,this._packagePropertyValues());if("undefined"!=typeof this.globalObj.webkit&&"undefined"!=typeof this.globalObj.webkit.messageHandlers&&"undefined"!=typeof this.globalObj.webkit.messageHandlers.wdcHandler)this.globalObj.webkit.messageHandlers.wdcHandler.postMessage(i);else{if(!this._sourceWindow)throw"Looks like the WDC is calling a tableau function before tableau.init() has been called.";this._sourceWindow.postMessage(i,this._sourceOrigin)}},o.prototype._getPayloadObj=function(t){var e=null;try{e=JSON.parse(t)}catch(t){return null}return e},o.prototype._getWebSecurityWarningConfirm=function(){var t=this._sourceOrigin,e=i(17),o=new e(t),a=o.host(),r=["localhost","tableau.github.io"];if(r.indexOf(a)>=0)return!0;if(a&&a.endsWith("online.tableau.com"))return!0;var s=n.getApprovedOrigins();if(s.indexOf(t)>=0)return console.log("Already approved the origin'"+t+"', not asking again"),!0;var l=this._getLocalizedString("webSecurityWarning"),c=l+"\n\n"+a+"\n",u=confirm(c);return u&&n.addApprovedOrigin(t),u},o.prototype._getCurrentLocale=function(){var t=navigator.language||navigator.userLanguage,e=t?t.substring(0,2):"en",i=["de","en","es","fr","ja","ko","pt","zh"];return i.indexOf(e)<0&&(e="en"),e},o.prototype._getLocalizedString=function(t){var e=this._getCurrentLocale(),o=i(9),n=i(10),a=i(11),r=i(13),s=i(12),l=i(14),c=i(15),u=i(16),h={de:o,en:n,es:a,fr:s,ja:r,ko:l,pt:c,zh:u},p=h[e];return p[t]},o.prototype._receiveMessage=function(t){console.log("Received message!");var e=this.globalObj._wdc;if(!e)throw"No WDC registered. Did you forget to call tableau.registerConnector?";var i=this._getPayloadObj(t.data);if(i){this._sourceWindow||(this._sourceWindow=t.source,this._sourceOrigin=t.origin);var o=i.msgData;switch(this._applyPropertyValues(i.props),i.msgName){case"init":var n=this._getWebSecurityWarningConfirm();n?(this.globalObj.tableau.phase=o.phase,this.globalObj._tableau.triggerInitialization()):window.close();break;case"shutdown":this.globalObj._tableau.triggerShutdown();break;case"getSchema":this.globalObj._tableau.triggerSchemaGathering();break;case"getData":this.globalObj._tableau.triggerDataGathering(o.tablesAndIncrementValues)}}},o.prototype._initPublicInterface=function(){console.log("Initializing public interface"),this._submitCalled=!1;var t={};t.abortForAuth=this._abortForAuth.bind(this),t.abortWithError=this._abortWithError.bind(this),t.addCrossOriginException=this._addCrossOriginException.bind(this),t.log=this._log.bind(this),t.reportProgress=this._reportProgress.bind(this),t.submit=this._submit.bind(this),this.publicInterface=t},o.prototype._abortForAuth=function(t){this._sendMessage("abortForAuth",{msg:t})},o.prototype._abortWithError=function(t){this._sendMessage("abortWithError",{errorMsg:t})},o.prototype._addCrossOriginException=function(t){console.log("Cross Origin Exception requested in the simulator. Pretending to work."),setTimeout(function(){this.globalObj._wdc.addCrossOriginExceptionCompleted(t)}.bind(this),0)},o.prototype._log=function(t){this._sendMessage("log",{logMsg:t})},o.prototype._reportProgress=function(t){this._sendMessage("reportProgress",{progressMsg:t})},o.prototype._submit=function(){this._sendMessage("submit")},o.prototype._initPrivateInterface=function(){console.log("Initializing private interface");var t={};t._initCallback=this._initCallback.bind(this),t._shutdownCallback=this._shutdownCallback.bind(this),t._schemaCallback=this._schemaCallback.bind(this),t._tableDataCallback=this._tableDataCallback.bind(this),t._dataDoneCallback=this._dataDoneCallback.bind(this),this.privateInterface=t},o.prototype._initCallback=function(){this._sendMessage("initCallback")},o.prototype._shutdownCallback=function(){this._sendMessage("shutdownCallback")},o.prototype._schemaCallback=function(t,e){this._sendMessage("_schemaCallback",{schema:t,standardConnections:e||[]})},o.prototype._tableDataCallback=function(t,e){this._sendMessage("_tableDataCallback",{tableName:t,data:e})},o.prototype._dataDoneCallback=function(){this._sendMessage("_dataDoneCallback")},t.exports=o},function(t,e){function i(t,e,i,o,n,a){this.tableInfo=t,this.incrementValue=e||"",this.isJoinFiltered=i,this.filterColumnId=o,this.filterValues=n,this._dataCallbackFn=a,this.appendRows=this._appendRows.bind(this)}i.prototype._appendRows=function(t){return t?Array.isArray(t)?void this._dataCallbackFn(this.tableInfo.id,t):void console.warn("Table.appendRows must take an array of arrays or array of objects"):void console.warn("rows data is null or undefined")},t.exports=i},function(t,e){function i(t,e){for(var i in t)"function"==typeof t[i]&&(e[i]=t[i])}t.exports.copyFunctions=i},function(t,e,i){var o;!function(n,a){"use strict";var r=function(t){if("object"!=typeof t.document)throw new Error("Cookies.js requires a `window` with a `document` object");var e=function(t,i,o){return 1===arguments.length?e.get(t):e.set(t,i,o)};return e._document=t.document,e._cacheKeyPrefix="cookey.",e._maxExpireDate=new Date("Fri, 31 Dec 9999 23:59:59 UTC"),e.defaults={path:"/",secure:!1},e.get=function(t){e._cachedDocumentCookie!==e._document.cookie&&e._renewCache();var i=e._cache[e._cacheKeyPrefix+t];return i===a?a:decodeURIComponent(i)},e.set=function(t,i,o){return o=e._getExtendedOptions(o),o.expires=e._getExpiresDate(i===a?-1:o.expires),e._document.cookie=e._generateCookieString(t,i,o),e},e.expire=function(t,i){return e.set(t,a,i)},e._getExtendedOptions=function(t){return{path:t&&t.path||e.defaults.path,domain:t&&t.domain||e.defaults.domain,expires:t&&t.expires||e.defaults.expires,secure:t&&t.secure!==a?t.secure:e.defaults.secure}},e._isValidDate=function(t){return"[object Date]"===Object.prototype.toString.call(t)&&!isNaN(t.getTime())},e._getExpiresDate=function(t,i){if(i=i||new Date,"number"==typeof t?t=t===1/0?e._maxExpireDate:new Date(i.getTime()+1e3*t):"string"==typeof t&&(t=new Date(t)),t&&!e._isValidDate(t))throw new Error("`expires` parameter cannot be converted to a valid Date instance");return t},e._generateCookieString=function(t,e,i){t=t.replace(/[^#$&+\^`|]/g,encodeURIComponent),t=t.replace(/\(/g,"%28").replace(/\)/g,"%29"),e=(e+"").replace(/[^!#$&-+\--:<-\[\]-~]/g,encodeURIComponent),i=i||{};var o=t+"="+e;return o+=i.path?";path="+i.path:"",o+=i.domain?";domain="+i.domain:"",o+=i.expires?";expires="+i.expires.toUTCString():"",o+=i.secure?";secure":""},e._getCacheFromString=function(t){for(var i={},o=t?t.split("; "):[],n=0;n<o.length;n++){var r=e._getKeyValuePairFromCookieString(o[n]);i[e._cacheKeyPrefix+r.key]===a&&(i[e._cacheKeyPrefix+r.key]=r.value)}return i},e._getKeyValuePairFromCookieString=function(t){var e=t.indexOf("=");e=e<0?t.length:e;var i,o=t.substr(0,e);try{i=decodeURIComponent(o)}catch(t){console&&"function"==typeof console.error&&console.error('Could not decode cookie with key "'+o+'"',t)}return{key:i,value:t.substr(e+1)}},e._renewCache=function(){e._cache=e._getCacheFromString(e._document.cookie),e._cachedDocumentCookie=e._document.cookie},e._areEnabled=function(){var t="cookies.js",i="1"===e.set(t,1).get(t);return e.expire(t),i},e.enabled=e._areEnabled(),e},s=n&&"object"==typeof n.document?r(n):r;o=function(){return s}.call(e,i,e,t),!(o!==a&&(t.exports=o))}("undefined"==typeof window?this:window)},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"To help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e){t.exports={webSecurityWarning:"wwTo help prevent malicious sites from getting access to your confidential data, confirm that you trust the following site:"}},function(t,e,i){var o;/*!
	 * jsUri
	 * https://github.com/derek-watson/jsUri
	 *
	 * Copyright 2013, Derek Watson
	 * Released under the MIT license.
	 *
	 * Includes parseUri regular expressions
	 * http://blog.stevenlevithan.com/archives/parseuri
	 * Copyright 2007, Steven Levithan
	 * Released under the MIT license.
	 */
!function(n){function a(t){return t&&(t=t.toString().replace(c.pluses,"%20"),t=decodeURIComponent(t)),t}function r(t){var e=c.uri_parser,i=["source","protocol","authority","userInfo","user","password","host","port","isColonUri","relative","path","directory","file","query","anchor"],o=e.exec(t||""),n={};return i.forEach(function(t,e){n[t]=o[e]||""}),n}function s(t){var e,i,o,n,r,s,l,u=[];if("undefined"==typeof t||null===t||""===t)return u;for(0===t.indexOf("?")&&(t=t.substring(1)),i=t.toString().split(c.query_separator),e=0,l=i.length;e<l;e++)o=i[e],n=o.indexOf("="),0!==n&&(r=a(o.substring(0,n)),s=a(o.substring(n+1)),u.push(n===-1?[o,null]:[r,s]));return u}function l(t){this.uriParts=r(t),this.queryPairs=s(this.uriParts.query),this.hasAuthorityPrefixUserPref=null}var c={starts_with_slashes:/^\/+/,ends_with_slashes:/\/+$/,pluses:/\+/g,query_separator:/[&;]/,uri_parser:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*)(?::([^:@]*))?)?@)?(\[[0-9a-fA-F:.]+\]|[^:\/?#]*)(?::(\d+|(?=:)))?(:)?)((((?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/};Array.prototype.forEach||(Array.prototype.forEach=function(t,e){var i,o;if(null==this)throw new TypeError(" this is null or not defined");var n=Object(this),a=n.length>>>0;if("function"!=typeof t)throw new TypeError(t+" is not a function");for(arguments.length>1&&(i=e),o=0;o<a;){var r;o in n&&(r=n[o],t.call(i,r,o,n)),o++}}),["protocol","userInfo","host","port","path","anchor"].forEach(function(t){l.prototype[t]=function(e){return"undefined"!=typeof e&&(this.uriParts[t]=e),this.uriParts[t]}}),l.prototype.hasAuthorityPrefix=function(t){return"undefined"!=typeof t&&(this.hasAuthorityPrefixUserPref=t),null===this.hasAuthorityPrefixUserPref?this.uriParts.source.indexOf("//")!==-1:this.hasAuthorityPrefixUserPref},l.prototype.isColonUri=function(t){return"undefined"==typeof t?!!this.uriParts.isColonUri:void(this.uriParts.isColonUri=!!t)},l.prototype.query=function(t){var e,i,o,n="";for("undefined"!=typeof t&&(this.queryPairs=s(t)),e=0,o=this.queryPairs.length;e<o;e++)i=this.queryPairs[e],n.length>0&&(n+="&"),null===i[1]?n+=i[0]:(n+=i[0],n+="=","undefined"!=typeof i[1]&&(n+=encodeURIComponent(i[1])));return n.length>0?"?"+n:n},l.prototype.getQueryParamValue=function(t){var e,i,o;for(i=0,o=this.queryPairs.length;i<o;i++)if(e=this.queryPairs[i],t===e[0])return e[1]},l.prototype.getQueryParamValues=function(t){var e,i,o,n=[];for(e=0,o=this.queryPairs.length;e<o;e++)i=this.queryPairs[e],t===i[0]&&n.push(i[1]);return n},l.prototype.deleteQueryParam=function(t,e){var i,o,n,r,s,l=[];for(i=0,s=this.queryPairs.length;i<s;i++)o=this.queryPairs[i],n=a(o[0])===a(t),r=o[1]===e,(1!==arguments.length||n)&&(2!==arguments.length||n&&r)||l.push(o);return this.queryPairs=l,this},l.prototype.addQueryParam=function(t,e,i){return 3===arguments.length&&i!==-1?(i=Math.min(i,this.queryPairs.length),this.queryPairs.splice(i,0,[t,e])):arguments.length>0&&this.queryPairs.push([t,e]),this},l.prototype.hasQueryParam=function(t){var e,i=this.queryPairs.length;for(e=0;e<i;e++)if(this.queryPairs[e][0]==t)return!0;return!1},l.prototype.replaceQueryParam=function(t,e,i){var o,n,r=-1,s=this.queryPairs.length;if(3===arguments.length){for(o=0;o<s;o++)if(n=this.queryPairs[o],a(n[0])===a(t)&&decodeURIComponent(n[1])===a(i)){r=o;break}r>=0&&this.deleteQueryParam(t,a(i)).addQueryParam(t,e,r)}else{for(o=0;o<s;o++)if(n=this.queryPairs[o],a(n[0])===a(t)){r=o;break}this.deleteQueryParam(t),this.addQueryParam(t,e,r)}return this},["protocol","hasAuthorityPrefix","isColonUri","userInfo","host","port","path","query","anchor"].forEach(function(t){var e="set"+t.charAt(0).toUpperCase()+t.slice(1);l.prototype[e]=function(e){return this[t](e),this}}),l.prototype.scheme=function(){var t="";return this.protocol()?(t+=this.protocol(),this.protocol().indexOf(":")!==this.protocol().length-1&&(t+=":"),t+="//"):this.hasAuthorityPrefix()&&this.host()&&(t+="//"),t},l.prototype.origin=function(){var t=this.scheme();return this.userInfo()&&this.host()&&(t+=this.userInfo(),this.userInfo().indexOf("@")!==this.userInfo().length-1&&(t+="@")),this.host()&&(t+=this.host(),(this.port()||this.path()&&this.path().substr(0,1).match(/[0-9]/))&&(t+=":"+this.port())),t},l.prototype.addTrailingSlash=function(){var t=this.path()||"";return"/"!==t.substr(-1)&&this.path(t+"/"),this},l.prototype.toString=function(){var t,e=this.origin();return this.isColonUri()?this.path()&&(e+=":"+this.path()):this.path()?(t=this.path(),c.ends_with_slashes.test(e)||c.starts_with_slashes.test(t)?(e&&e.replace(c.ends_with_slashes,"/"),t=t.replace(c.starts_with_slashes,"/")):e+="/",e+=t):this.host()&&(this.query().toString()||this.anchor())&&(e+="/"),this.query().toString()&&(e+=this.query().toString()),this.anchor()&&(0!==this.anchor().indexOf("#")&&(e+="#"),e+=this.anchor()),e},l.prototype.clone=function(){return new l(this.toString())},o=function(){return l}.call(e,i,e,t),!(void 0!==o&&(t.exports=o))}(this)},function(t,e,i){"use strict";function o(t,e,i){function a(t,e){var o=t[0],a=t[1];c[o]={connect:function(t){return"function"!=typeof t?void console.error("Bad callback given to connect to signal "+o):(c.__objectSignals__[a]=c.__objectSignals__[a]||[],c.__objectSignals__[a].push(t),void(e||"destroyed"===o||i.exec({type:n.connectToSignal,object:c.__id__,signal:a})))},disconnect:function(t){if("function"!=typeof t)return void console.error("Bad callback given to disconnect from signal "+o);c.__objectSignals__[a]=c.__objectSignals__[a]||[];var r=c.__objectSignals__[a].indexOf(t);return r===-1?void console.error("Cannot find connection of signal "+o+" to "+t.name):(c.__objectSignals__[a].splice(r,1),void(e||0!==c.__objectSignals__[a].length||i.exec({type:n.disconnectFromSignal,object:c.__id__,signal:a})))}}}function r(t,e){var i=c.__objectSignals__[t];i&&i.forEach(function(t){t.apply(t,e)})}function s(t){var e=t[0],o=t[1];c[e]=function(){for(var t,e=[],a=0;a<arguments.length;++a)"function"==typeof arguments[a]?t=arguments[a]:e.push(arguments[a]);i.exec({type:n.invokeMethod,object:c.__id__,method:o,args:e},function(e){if(void 0!==e){var i=c.unwrapQObject(e);t&&t(i)}})}}function l(t){var e=t[0],o=t[1],r=t[2];c.__propertyCache__[e]=t[3],r&&(1===r[0]&&(r[0]=o+"Changed"),a(r,!0)),Object.defineProperty(c,o,{get:function(){var t=c.__propertyCache__[e];return void 0===t&&console.warn('Undefined value in property cache for property "'+o+'" in object '+c.__id__),t},set:function(t){return void 0===t?void console.warn("Property setter for "+o+" called with undefined value!"):(c.__propertyCache__[e]=t,void i.exec({type:n.setProperty,object:c.__id__,property:e,value:t}))}})}this.__id__=t,i.objects[t]=this,this.__objectSignals__={},this.__propertyCache__={};var c=this;this.unwrapQObject=function(t){if(t instanceof Array){for(var e=new Array(t.length),n=0;n<t.length;++n)e[n]=c.unwrapQObject(t[n]);return e}if(!t||!t["__QObject*__"]||void 0===t.id)return t;var a=t.id;if(i.objects[a])return i.objects[a];if(!t.data)return void console.error("Cannot unwrap unknown QObject "+a+" without data.");var r=new o(a,t.data,i);return r.destroyed.connect(function(){if(i.objects[a]===r){delete i.objects[a];var t=[];for(var e in r)t.push(e);for(var o in t)delete r[t[o]]}}),r.unwrapProperties(),r},this.unwrapProperties=function(){for(var t in c.__propertyCache__)c.__propertyCache__[t]=c.unwrapQObject(c.__propertyCache__[t])},this.propertyUpdate=function(t,e){for(var i in e){var o=e[i];c.__propertyCache__[i]=o}for(var n in t)r(n,t[n])},this.signalEmitted=function(t,e){r(t,e)},e.methods.forEach(s),e.properties.forEach(l),e.signals.forEach(function(t){a(t,!1)});for(var t in e.enums)c[t]=e.enums[t]}var n={signal:1,propertyUpdate:2,init:3,idle:4,debug:5,invokeMethod:6,connectToSignal:7,disconnectFromSignal:8,setProperty:9,response:10},a=function(t,e){if("object"!=typeof t||"function"!=typeof t.send)return void console.error("The QWebChannel expects a transport object with a send function and onmessage callback property. Given is: transport: "+typeof t+", transport.send: "+typeof t.send);var i=this;this.transport=t,this.send=function(t){"string"!=typeof t&&(t=JSON.stringify(t)),i.transport.send(t)},this.transport.onmessage=function(t){var e=t.data;switch("string"==typeof e&&(e=JSON.parse(e)),e.type){case n.signal:i.handleSignal(e);break;case n.response:i.handleResponse(e);break;case n.propertyUpdate:i.handlePropertyUpdate(e);break;default:console.error("invalid message received:",t.data)}},this.execCallbacks={},this.execId=0,this.exec=function(t,e){return e?(i.execId===Number.MAX_VALUE&&(i.execId=Number.MIN_VALUE),t.hasOwnProperty("id")?void console.error("Cannot exec message with property id: "+JSON.stringify(t)):(t.id=i.execId++,i.execCallbacks[t.id]=e,void i.send(t))):void i.send(t)},this.objects={},this.handleSignal=function(t){var e=i.objects[t.object];e?e.signalEmitted(t.signal,t.args):console.warn("Unhandled signal: "+t.object+"::"+t.signal)},this.handleResponse=function(t){return t.hasOwnProperty("id")?(i.execCallbacks[t.id](t.data),void delete i.execCallbacks[t.id]):void console.error("Invalid response message received: ",JSON.stringify(t))},this.handlePropertyUpdate=function(t){for(var e in t.data){var o=t.data[e],a=i.objects[o.object];a?a.propertyUpdate(o.signals,o.properties):console.warn("Unhandled property update: "+o.object+"::"+o.signal)}i.exec({type:n.idle})},this.debug=function(t){i.send({type:n.debug,data:t})},i.exec({type:n.init},function(t){for(var a in t)var r=new o(a,t[a],i);for(var a in i.objects)i.objects[a].unwrapProperties();e&&e(i),i.exec({type:n.idle})})};t.exports={QWebChannel:a}},function(t,e,i){"use strict";function o(t,e){n.copyFunctions(t.publicInterface,window.tableau),n.copyFunctions(t.privateInterface,window._tableau),e.init()}var n=i(7),a=i(4),r=i(3),s=i(5),l=i(18);t.exports.init=function(){var t=null,e=null;window._tableau={},window.tableauVersionBootstrap?(console.log("Initializing NativeDispatcher, Reporting version number"),window.tableauVersionBootstrap.ReportVersionNumber("2.2.0"),t=new r(window)):window.qt&&window.qt.webChannelTransport?(console.log("Initializing NativeDispatcher for qwebchannel"),window.tableau={},window.channel=new l.QWebChannel(qt.webChannelTransport,function(i){console.log("QWebChannel created successfully"),window._tableau._nativeSetupCompleted=function(){t=new r(i.objects),window.tableau=i.objects.tableau,e.changeTableauApiObj(window.tableau),o(t,e)},i.objects.tableauVersionBootstrap.ReportVersionNumber("2.2.0")})):(console.log("Version Bootstrap is not defined, Initializing SimulatorDispatcher"),window.tableau={},t=new s(window)),e=new a(window.tableau,window._tableau,window),t&&o(t,e)}}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLm1pbi5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9idW5kbGUubWluLmpzIiwid2VicGFjazovLy8iXSwibWFwcGluZ3MiOiI7QUFDQTs7Ozs7Ozs7Ozs7O0FDcW5DQSIsInNvdXJjZVJvb3QiOiIifQ==
;(function(){
var h,aa=this;function ba(a){return"string"==typeof a}
function q(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function fa(a){return"function"==q(a)}var ha="closure_uid_"+(1E9*Math.random()>>>0),ia=0;function ja(a,b,c){return a.call.apply(a.bind,arguments)}function ka(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}
function la(a,b,c){la=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ja:ka;return la.apply(null,arguments)};var ma=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")};function na(a,b){return a<b?-1:a>b?1:0};function ra(a,b){a.sort(b||sa)}function va(a,b){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]={index:d,value:a[d]};var e=b||sa;ra(c,function(a,b){return e(a.value,b.value)||a.index-b.index});for(d=0;d<a.length;d++)a[d]=c[d].value}function sa(a,b){return a>b?1:a<b?-1:0};var wa;a:{var xa=aa.navigator;if(xa){var ya=xa.userAgent;if(ya){wa=ya;break a}}wa=""}function za(a){return-1!=wa.indexOf(a)};function Aa(a,b){for(var c in a)b.call(void 0,a[c],c,a)}function Ba(a,b){return null!==a&&b in a?a[b]:void 0};function Ca(){return za("iPhone")&&!za("iPod")&&!za("iPad")};function Da(a,b){var c=Ea;Object.prototype.hasOwnProperty.call(c,a)||(c[a]=b(a))};var Fa=za("Opera"),Ga=za("Trident")||za("MSIE"),Ha=za("Edge"),Ia=za("Gecko")&&!(-1!=wa.toLowerCase().indexOf("webkit")&&!za("Edge"))&&!(za("Trident")||za("MSIE"))&&!za("Edge"),Ka=-1!=wa.toLowerCase().indexOf("webkit")&&!za("Edge");Ka&&za("Mobile");za("Macintosh");za("Windows");za("Linux")||za("CrOS");var La=aa.navigator||null;La&&(La.appVersion||"").indexOf("X11");za("Android");Ca();za("iPad");za("iPod");Ca()||za("iPad")||za("iPod");function Na(){var a=aa.document;return a?a.documentMode:void 0}var Oa;
a:{var Pa="",Qa=function(){var a=wa;if(Ia)return/rv\:([^\);]+)(\)|;)/.exec(a);if(Ha)return/Edge\/([\d\.]+)/.exec(a);if(Ga)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(Ka)return/WebKit\/(\S+)/.exec(a);if(Fa)return/(?:Version)[ \/]?(\S+)/.exec(a)}();Qa&&(Pa=Qa?Qa[1]:"");if(Ga){var Sa=Na();if(null!=Sa&&Sa>parseFloat(Pa)){Oa=String(Sa);break a}}Oa=Pa}var Ea={};
function Ta(a){Da(a,function(){for(var b=0,c=ma(String(Oa)).split("."),d=ma(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var g=c[f]||"",k=d[f]||"";do{g=/(\d*)(\D*)(.*)/.exec(g)||["","","",""];k=/(\d*)(\D*)(.*)/.exec(k)||["","","",""];if(0==g[0].length&&0==k[0].length)break;b=na(0==g[1].length?0:parseInt(g[1],10),0==k[1].length?0:parseInt(k[1],10))||na(0==g[2].length,0==k[2].length)||na(g[2],k[2]);g=g[3];k=k[3]}while(0==b)}return 0<=b})}var Ua;var Va=aa.document;
Ua=Va&&Ga?Na()||("CSS1Compat"==Va.compatMode?parseInt(Oa,10):5):void 0;var Wa;if(!(Wa=!Ia&&!Ga)){var Xa;if(Xa=Ga)Xa=9<=Number(Ua);Wa=Xa}Wa||Ia&&Ta("1.9.1");Ga&&Ta("9");function $a(){var a=document;return ba("loadingCurtain")?a.getElementById("loadingCurtain"):"loadingCurtain"};function ab(a,b){this.W=[];this.ob=b;for(var c=!0,d=a.length-1;0<=d;d--){var e=a[d]|0;c&&e==b||(this.W[d]=e,c=!1)}}var bb={};function cb(a){if(-128<=a&&128>a){var b=bb[a];if(b)return b}b=new ab([a|0],0>a?-1:0);-128<=a&&128>a&&(bb[a]=b);return b}function db(a){if(isNaN(a)||!isFinite(a))return fb;if(0>a)return db(-a).na();for(var b=[],c=1,d=0;a>=c;d++)b[d]=a/c|0,c*=gb;return new ab(b,0)}var gb=4294967296,fb=cb(0),hb=cb(1),ib=cb(16777216);h=ab.prototype;
h.Qd=function(){return 0<this.W.length?this.W[0]:this.ob};h.Ib=function(){if(this.wa())return-this.na().Ib();for(var a=0,b=1,c=0;c<this.W.length;c++){var d=jb(this,c);a+=(0<=d?d:gb+d)*b;b*=gb}return a};
h.toString=function(a){a=a||10;if(2>a||36<a)throw Error("radix out of range: "+a);if(this.Ya())return"0";if(this.wa())return"-"+this.na().toString(a);for(var b=db(Math.pow(a,6)),c=this,d="";;){var e=kb(c,b),f=(c.ic(e.multiply(b)).Qd()>>>0).toString(a);c=e;if(c.Ya())return f+d;for(;6>f.length;)f="0"+f;d=""+f+d}};function jb(a,b){return 0>b?0:b<a.W.length?a.W[b]:a.ob}h.Ya=function(){if(0!=this.ob)return!1;for(var a=0;a<this.W.length;a++)if(0!=this.W[a])return!1;return!0};h.wa=function(){return-1==this.ob};
h.nd=function(a){return 0<this.compare(a)};h.od=function(a){return 0<=this.compare(a)};h.Ec=function(){return 0>this.compare(ib)};h.Fc=function(a){return 0>=this.compare(a)};h.compare=function(a){a=this.ic(a);return a.wa()?-1:a.Ya()?0:1};h.na=function(){return this.Ed().add(hb)};
h.add=function(a){for(var b=Math.max(this.W.length,a.W.length),c=[],d=0,e=0;e<=b;e++){var f=d+(jb(this,e)&65535)+(jb(a,e)&65535),g=(f>>>16)+(jb(this,e)>>>16)+(jb(a,e)>>>16);d=g>>>16;f&=65535;g&=65535;c[e]=g<<16|f}return new ab(c,c[c.length-1]&-2147483648?-1:0)};h.ic=function(a){return this.add(a.na())};
h.multiply=function(a){if(this.Ya()||a.Ya())return fb;if(this.wa())return a.wa()?this.na().multiply(a.na()):this.na().multiply(a).na();if(a.wa())return this.multiply(a.na()).na();if(this.Ec()&&a.Ec())return db(this.Ib()*a.Ib());for(var b=this.W.length+a.W.length,c=[],d=0;d<2*b;d++)c[d]=0;for(d=0;d<this.W.length;d++)for(var e=0;e<a.W.length;e++){var f=jb(this,d)>>>16,g=jb(this,d)&65535,k=jb(a,e)>>>16,l=jb(a,e)&65535;c[2*d+2*e]+=g*l;lb(c,2*d+2*e);c[2*d+2*e+1]+=f*l;lb(c,2*d+2*e+1);c[2*d+2*e+1]+=g*k;
lb(c,2*d+2*e+1);c[2*d+2*e+2]+=f*k;lb(c,2*d+2*e+2)}for(d=0;d<b;d++)c[d]=c[2*d+1]<<16|c[2*d];for(d=b;d<2*b;d++)c[d]=0;return new ab(c,0)};function lb(a,b){for(;(a[b]&65535)!=a[b];)a[b+1]+=a[b]>>>16,a[b]&=65535,b++}
function kb(a,b){if(b.Ya())throw Error("division by zero");if(a.Ya())return fb;if(a.wa())return b.wa()?kb(a.na(),b.na()):kb(a.na(),b).na();if(b.wa())return kb(a,b.na()).na();if(30<a.W.length){if(a.wa()||b.wa())throw Error("slowDivide_ only works with positive integers.");for(var c=hb,d=b;d.Fc(a);)c=c.shiftLeft(1),d=d.shiftLeft(1);var e=c.zb(1),f=d.zb(1);d=d.zb(2);for(c=c.zb(2);!d.Ya();){var g=f.add(d);g.Fc(a)&&(e=e.add(c),f=g);d=d.zb(1);c=c.zb(1)}return e}c=fb;for(d=a;d.od(b);){e=Math.max(1,Math.floor(d.Ib()/
b.Ib()));f=Math.ceil(Math.log(e)/Math.LN2);f=48>=f?1:Math.pow(2,f-48);g=db(e);for(var k=g.multiply(b);k.wa()||k.nd(d);)e-=f,g=db(e),k=g.multiply(b);g.Ya()&&(g=hb);c=c.add(g);d=d.ic(k)}return c}h.Ed=function(){for(var a=this.W.length,b=[],c=0;c<a;c++)b[c]=~this.W[c];return new ab(b,~this.ob)};h.shiftLeft=function(a){var b=a>>5;a%=32;for(var c=this.W.length+b+(0<a?1:0),d=[],e=0;e<c;e++)d[e]=0<a?jb(this,e-b)<<a|jb(this,e-b-1)>>>32-a:jb(this,e-b);return new ab(d,this.ob)};
h.zb=function(a){var b=a>>5;a%=32;for(var c=this.W.length-b,d=[],e=0;e<c;e++)d[e]=0<a?jb(this,e+b)>>>a|jb(this,e+b+1)<<32-a:jb(this,e+b);return new ab(d,this.ob)};function mb(a,b){null!=a&&this.append.apply(this,arguments)}h=mb.prototype;h.kb="";h.set=function(a){this.kb=""+a};h.append=function(a,b){this.kb+=String(a);if(null!=b)for(var c=1;c<arguments.length;c++)this.kb+=arguments[c];return this};h.clear=function(){this.kb=""};h.toString=function(){return this.kb};var nb;if("undefined"===typeof r)var r={};if("undefined"===typeof ob)var ob=null;if("undefined"===typeof pb)var pb=null;var qb=!0,rb=null;if("undefined"===typeof sb)var sb=null;function tb(){return new v(null,5,[ub,!0,vb,!0,wb,!1,xb,!1,yb,null],null)}function w(a){return null!=a&&!1!==a}function zb(a){return a instanceof Array}function Ab(a){return null==a?!0:!1===a?!0:!1}function Bb(a){return ba(a)}function A(a,b){return a[q(null==b?null:b)]?!0:a._?!0:!1}
function Cb(a){return null==a?null:a.constructor}function B(a,b){var c=Cb(b);c=w(w(c)?c.va:c)?c.pa:q(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function Db(a){var b=a.pa;return w(b)?b:""+C.a(a)}var Eb="undefined"!==typeof Symbol&&"function"===q(Symbol)?Symbol.iterator:"@@iterator";function Fb(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}function Gb(a){return Hb(function(a,c){a.push(c);return a},[],a)}function Ib(){}
function Jb(){}function Kb(){}var Lb=function Lb(b){if(null!=b&&null!=b.P)return b.P(b);var c=Lb[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Lb._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("ICounted.-count",b);},Mb=function Mb(b){if(null!=b&&null!=b.X)return b.X(b);var c=Mb[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Mb._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IEmptyableCollection.-empty",b);};function Ob(){}
var Pb=function Pb(b,c){if(null!=b&&null!=b.T)return b.T(b,c);var d=Pb[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Pb._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("ICollection.-conj",b);};function Qb(){}var Rb=function Rb(b){switch(arguments.length){case 2:return Rb.b(arguments[0],arguments[1]);case 3:return Rb.f(arguments[0],arguments[1],arguments[2]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};
Rb.b=function(a,b){if(null!=a&&null!=a.L)return a.L(a,b);var c=Rb[q(null==a?null:a)];if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);c=Rb._;if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);throw B("IIndexed.-nth",a);};Rb.f=function(a,b,c){if(null!=a&&null!=a.ua)return a.ua(a,b,c);var d=Rb[q(null==a?null:a)];if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);d=Rb._;if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);throw B("IIndexed.-nth",a);};Rb.B=3;function Sb(){}
var E=function E(b){if(null!=b&&null!=b.$)return b.$(b);var c=E[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=E._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("ISeq.-first",b);},Tb=function Tb(b){if(null!=b&&null!=b.ka)return b.ka(b);var c=Tb[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Tb._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("ISeq.-rest",b);};function Ub(){}function Vb(){}
var Wb=function Wb(b){switch(arguments.length){case 2:return Wb.b(arguments[0],arguments[1]);case 3:return Wb.f(arguments[0],arguments[1],arguments[2]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};Wb.b=function(a,b){if(null!=a&&null!=a.S)return a.S(a,b);var c=Wb[q(null==a?null:a)];if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);c=Wb._;if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);throw B("ILookup.-lookup",a);};
Wb.f=function(a,b,c){if(null!=a&&null!=a.H)return a.H(a,b,c);var d=Wb[q(null==a?null:a)];if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);d=Wb._;if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);throw B("ILookup.-lookup",a);};Wb.B=3;
var Xb=function Xb(b,c){if(null!=b&&null!=b.Mb)return b.Mb(b,c);var d=Xb[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Xb._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IAssociative.-contains-key?",b);},Yb=function Yb(b,c,d){if(null!=b&&null!=b.cb)return b.cb(b,c,d);var e=Yb[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);e=Yb._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("IAssociative.-assoc",b);};function Zb(){}
function $b(){}var ac=function ac(b){if(null!=b&&null!=b.Qb)return b.Qb(b);var c=ac[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=ac._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IMapEntry.-key",b);},bc=function bc(b){if(null!=b&&null!=b.Rb)return b.Rb(b);var c=bc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=bc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IMapEntry.-val",b);};function cc(){}function dc(){}
var ec=function ec(b){if(null!=b&&null!=b.sb)return b.sb(b);var c=ec[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=ec._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IDeref.-deref",b);};function fc(){}
var gc=function gc(b){if(null!=b&&null!=b.G)return b.G(b);var c=gc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=gc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IMeta.-meta",b);},hc=function hc(b,c){if(null!=b&&null!=b.I)return b.I(b,c);var d=hc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=hc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IWithMeta.-with-meta",b);};function ic(){}
var jc=function jc(b){switch(arguments.length){case 2:return jc.b(arguments[0],arguments[1]);case 3:return jc.f(arguments[0],arguments[1],arguments[2]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};jc.b=function(a,b){if(null!=a&&null!=a.da)return a.da(a,b);var c=jc[q(null==a?null:a)];if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);c=jc._;if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);throw B("IReduce.-reduce",a);};
jc.f=function(a,b,c){if(null!=a&&null!=a.ea)return a.ea(a,b,c);var d=jc[q(null==a?null:a)];if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);d=jc._;if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);throw B("IReduce.-reduce",a);};jc.B=3;function kc(){}
var lc=function lc(b,c,d){if(null!=b&&null!=b.Pb)return b.Pb(b,c,d);var e=lc[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);e=lc._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("IKVReduce.-kv-reduce",b);},nc=function nc(b,c){if(null!=b&&null!=b.v)return b.v(b,c);var d=nc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=nc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IEquiv.-equiv",b);},oc=function oc(b){if(null!=b&&null!=b.N)return b.N(b);
var c=oc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=oc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IHash.-hash",b);};function pc(){}var qc=function qc(b){if(null!=b&&null!=b.M)return b.M(b);var c=qc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=qc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("ISeqable.-seq",b);};function rc(){}function sc(){}function tc(){}function uc(){}
var vc=function vc(b){if(null!=b&&null!=b.bc)return b.bc(b);var c=vc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=vc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IReversible.-rseq",b);},wc=function wc(b,c){if(null!=b&&null!=b.sc)return b.sc(0,c);var d=wc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=wc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IWriter.-write",b);},xc=function xc(b,c,d){if(null!=b&&null!=b.rc)return b.rc(0,c,d);
var e=xc[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);e=xc._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("IWatchable.-notify-watches",b);},yc=function yc(b){if(null!=b&&null!=b.tb)return b.tb(b);var c=yc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=yc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IEditableCollection.-as-transient",b);},zc=function zc(b,c){if(null!=b&&null!=b.ub)return b.ub(b,c);var d=zc[q(null==b?null:b)];if(null!=
d)return d.b?d.b(b,c):d.call(null,b,c);d=zc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("ITransientCollection.-conj!",b);},Ac=function Ac(b){if(null!=b&&null!=b.Cb)return b.Cb(b);var c=Ac[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Ac._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("ITransientCollection.-persistent!",b);},Bc=function Bc(b,c,d){if(null!=b&&null!=b.lb)return b.lb(b,c,d);var e=Bc[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):e.call(null,
b,c,d);e=Bc._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("ITransientAssociative.-assoc!",b);};function Cc(){}
var Dc=function Dc(b,c){if(null!=b&&null!=b.rb)return b.rb(b,c);var d=Dc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Dc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IComparable.-compare",b);},Ec=function Ec(b){if(null!=b&&null!=b.mc)return b.mc();var c=Ec[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Ec._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IChunk.-drop-first",b);},Fc=function Fc(b){if(null!=b&&null!=b.$b)return b.$b(b);var c=
Fc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Fc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IChunkedSeq.-chunked-first",b);},Gc=function Gc(b){if(null!=b&&null!=b.Nb)return b.Nb(b);var c=Gc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Gc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IChunkedSeq.-chunked-rest",b);},Hc=function Hc(b,c){if(null!=b&&null!=b.Zc)return b.Zc(b,c);var d=Hc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,
b,c);d=Hc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IReset.-reset!",b);},Ic=function Ic(b){switch(arguments.length){case 2:return Ic.b(arguments[0],arguments[1]);case 3:return Ic.f(arguments[0],arguments[1],arguments[2]);case 4:return Ic.w(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return Ic.R(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};
Ic.b=function(a,b){if(null!=a&&null!=a.ad)return a.ad(a,b);var c=Ic[q(null==a?null:a)];if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);c=Ic._;if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);throw B("ISwap.-swap!",a);};Ic.f=function(a,b,c){if(null!=a&&null!=a.bd)return a.bd(a,b,c);var d=Ic[q(null==a?null:a)];if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);d=Ic._;if(null!=d)return d.f?d.f(a,b,c):d.call(null,a,b,c);throw B("ISwap.-swap!",a);};
Ic.w=function(a,b,c,d){if(null!=a&&null!=a.cd)return a.cd(a,b,c,d);var e=Ic[q(null==a?null:a)];if(null!=e)return e.w?e.w(a,b,c,d):e.call(null,a,b,c,d);e=Ic._;if(null!=e)return e.w?e.w(a,b,c,d):e.call(null,a,b,c,d);throw B("ISwap.-swap!",a);};Ic.R=function(a,b,c,d,e){if(null!=a&&null!=a.dd)return a.dd(a,b,c,d,e);var f=Ic[q(null==a?null:a)];if(null!=f)return f.R?f.R(a,b,c,d,e):f.call(null,a,b,c,d,e);f=Ic._;if(null!=f)return f.R?f.R(a,b,c,d,e):f.call(null,a,b,c,d,e);throw B("ISwap.-swap!",a);};
Ic.B=5;var Jc=function Jc(b,c){if(null!=b&&null!=b.qc)return b.qc(0,c);var d=Jc[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Jc._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IVolatile.-vreset!",b);};function Kc(){}var Lc=function Lc(b){if(null!=b&&null!=b.xa)return b.xa(b);var c=Lc[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Lc._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IIterable.-iterator",b);};
function Mc(a){this.Pd=a;this.h=1073741824;this.s=0}Mc.prototype.sc=function(a,b){return this.Pd.append(b)};function Nc(a){var b=new mb;a.O(null,new Mc(b),tb());return""+C.a(b)}var Oc="undefined"!==typeof Math.imul&&0!==Math.imul(4294967295,5)?function(a,b){return Math.imul(a,b)}:function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0};function Pc(a){a=Oc(a|0,-862048943);return Oc(a<<15|a>>>-15,461845907)}
function Qc(a,b){var c=(a|0)^(b|0);return Oc(c<<13|c>>>-13,5)+-430675100|0}function Rc(a,b){var c=(a|0)^b;c=Oc(c^c>>>16,-2048144789);c=Oc(c^c>>>13,-1028477387);return c^c>>>16}function Sc(a){a:{var b=1;for(var c=0;;)if(b<a.length){var d=b+2;c=Qc(c,Pc(a.charCodeAt(b-1)|a.charCodeAt(b)<<16));b=d}else{b=c;break a}}b=1===(a.length&1)?b^Pc(a.charCodeAt(a.length-1)):b;return Rc(b,Oc(2,a.length))}var Tc={},Uc=0;
function Vc(a){255<Uc&&(Tc={},Uc=0);if(null==a)return 0;var b=Tc[a];if("number"!==typeof b){a:if(null!=a)if(b=a.length,0<b)for(var c=0,d=0;;)if(c<b){var e=c+1;d=Oc(31,d)+a.charCodeAt(c);c=e}else{b=d;break a}else b=0;else b=0;Tc[a]=b;Uc+=1}return a=b}
function Wc(a){if(null!=a&&(a.h&4194304||r===a.Yd))return a.N(null)^0;if("number"===typeof a){if(w(isFinite(a)))return Math.floor(a)%2147483647;switch(a){case Infinity:return 2146435072;case -Infinity:return-1048576;default:return 2146959360}}else return!0===a?a=1231:!1===a?a=1237:"string"===typeof a?(a=Vc(a),0!==a&&(a=Pc(a),a=Qc(0,a),a=Rc(a,4))):a=a instanceof Date?a.valueOf()^0:null==a?0:oc(a)^0,a}function Xc(a,b){return a^b+2654435769+(a<<6)+(a>>2)}
function Yc(a,b){if(a.Ia===b.Ia)return 0;var c=Ab(a.ia);if(w(c?b.ia:c))return-1;if(w(a.ia)){if(Ab(b.ia))return 1;c=sa(a.ia,b.ia);return 0===c?sa(a.name,b.name):c}return sa(a.name,b.name)}function F(a,b,c,d,e){this.ia=a;this.name=b;this.Ia=c;this.qb=d;this.ja=e;this.h=2154168321;this.s=4096}h=F.prototype;h.toString=function(){return this.Ia};h.equiv=function(a){return this.v(null,a)};h.v=function(a,b){return b instanceof F?this.Ia===b.Ia:!1};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return G.b(c,this);case 3:return G.f(c,this,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return G.b(c,this)};a.f=function(a,c,d){return G.f(c,this,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return G.b(a,this)};h.b=function(a,b){return G.f(a,this,b)};h.G=function(){return this.ja};
h.I=function(a,b){return new F(this.ia,this.name,this.Ia,this.qb,b)};h.N=function(){var a=this.qb;return null!=a?a:this.qb=a=Xc(Sc(this.name),Vc(this.ia))};h.O=function(a,b){return wc(b,this.Ia)};var Zc=function Zc(b){switch(arguments.length){case 1:return Zc.a(arguments[0]);case 2:return Zc.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};
Zc.a=function(a){if(a instanceof F)return a;var b=a.indexOf("/");return 1>b?Zc.b(null,a):Zc.b(a.substring(0,b),a.substring(b+1,a.length))};Zc.b=function(a,b){var c=null!=a?[C.a(a),C.a("/"),C.a(b)].join(""):b;return new F(a,b,c,null,null)};Zc.B=2;function $c(a){return null!=a?a.s&131072||r===a.Zd?!0:a.s?!1:A(Kc,a):A(Kc,a)}
function H(a){if(null==a)return null;if(null!=a&&(a.h&8388608||r===a.$c))return a.M(null);if(zb(a)||"string"===typeof a)return 0===a.length?null:new ad(a,0,null);if(A(pc,a))return qc(a);throw Error([C.a(a),C.a(" is not ISeqable")].join(""));}function K(a){if(null==a)return null;if(null!=a&&(a.h&64||r===a.Z))return a.$(null);a=H(a);return null==a?null:E(a)}function bd(a){return null!=a?null!=a&&(a.h&64||r===a.Z)?a.ka(null):(a=H(a))?Tb(a):L:L}
function M(a){return null==a?null:null!=a&&(a.h&128||r===a.Sb)?a.Y(null):H(bd(a))}var O=function O(b){switch(arguments.length){case 1:return O.a(arguments[0]);case 2:return O.b(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return O.l(arguments[0],arguments[1],new ad(c.slice(2),0,null))}};O.a=function(){return!0};O.b=function(a,b){return null==a?null==b:a===b||nc(a,b)};
O.l=function(a,b,c){for(;;)if(O.b(a,b))if(M(c))a=b,b=K(c),c=M(c);else return O.b(b,K(c));else return!1};O.F=function(a){var b=K(a),c=M(a);a=K(c);c=M(c);return O.l(b,a,c)};O.B=2;function cd(a){this.A=a}cd.prototype.next=function(){if(null!=this.A){var a=K(this.A);this.A=M(this.A);return{value:a,done:!1}}return{value:null,done:!0}};function dd(a){return new cd(H(a))}function ed(a,b){var c=Pc(a);c=Qc(0,c);return Rc(c,b)}
function fd(a){var b=0,c=1;for(a=H(a);;)if(null!=a)b+=1,c=Oc(31,c)+Wc(K(a))|0,a=M(a);else return ed(c,b)}var gd=ed(1,0);function hd(a){var b=0,c=0;for(a=H(a);;)if(null!=a)b+=1,c=c+Wc(K(a))|0,a=M(a);else return ed(c,b)}var id=ed(0,0);Kb["null"]=!0;Lb["null"]=function(){return 0};Date.prototype.v=function(a,b){return b instanceof Date&&this.valueOf()===b.valueOf()};Date.prototype.Ob=r;
Date.prototype.rb=function(a,b){if(b instanceof Date)return sa(this.valueOf(),b.valueOf());throw Error([C.a("Cannot compare "),C.a(this),C.a(" to "),C.a(b)].join(""));};nc.number=function(a,b){return a===b};Ib["function"]=!0;fc["function"]=!0;gc["function"]=function(){return null};oc._=function(a){return a[ha]||(a[ha]=++ia)};function jd(a){this.ca=a;this.h=32768;this.s=0}jd.prototype.sb=function(){return this.ca};function kd(a){return a instanceof jd}
function ld(a,b){var c=a.length;if(0===a.length)return b.m?b.m():b.call(null);for(var d=a[0],e=1;;)if(e<c){var f=a[e];d=b.b?b.b(d,f):b.call(null,d,f);if(kd(d))return ec(d);e+=1}else return d}function md(a,b,c){var d=a.length,e=c;for(c=0;;)if(c<d){var f=a[c];e=b.b?b.b(e,f):b.call(null,e,f);if(kd(e))return ec(e);c+=1}else return e}function nd(a,b,c,d){for(var e=a.length;;)if(d<e){var f=a[d];c=b.b?b.b(c,f):b.call(null,c,f);if(kd(c))return ec(c);d+=1}else return c}
function od(a){return null!=a?a.h&2||r===a.Qc?!0:a.h?!1:A(Kb,a):A(Kb,a)}function pd(a){return null!=a?a.h&16||r===a.oc?!0:a.h?!1:A(Qb,a):A(Qb,a)}function P(a,b,c){var d=Q(a);if(c>=d)return-1;!(0<c)&&0>c&&(c+=d,c=0>c?0:c);for(;;)if(c<d){if(O.b(qd(a,c),b))return c;c+=1}else return-1}function rd(a,b,c){var d=Q(a);if(0===d)return-1;0<c?(--d,c=d<c?d:c):c=0>c?d+c:c;for(;;)if(0<=c){if(O.b(qd(a,c),b))return c;--c}else return-1}function sd(a,b){this.c=a;this.i=b}sd.prototype.aa=function(){return this.i<this.c.length};
sd.prototype.next=function(){var a=this.c[this.i];this.i+=1;return a};function ad(a,b,c){this.c=a;this.i=b;this.o=c;this.h=166592766;this.s=139264}h=ad.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.L=function(a,b){var c=b+this.i;if(0<=c&&c<this.c.length)return this.c[c];throw Error("Index out of bounds");};h.ua=function(a,b,c){a=b+this.i;return 0<=a&&a<this.c.length?this.c[a]:c};
h.xa=function(){return new sd(this.c,this.i)};h.G=function(){return this.o};h.Y=function(){return this.i+1<this.c.length?new ad(this.c,this.i+1,null):null};h.P=function(){var a=this.c.length-this.i;return 0>a?0:a};h.bc=function(){var a=this.P(null);return 0<a?new td(this,a-1,null):null};h.N=function(){return fd(this)};h.v=function(a,b){return wd(this,b)};h.X=function(){return L};h.da=function(a,b){return nd(this.c,b,this.c[this.i],this.i+1)};h.ea=function(a,b,c){return nd(this.c,b,c,this.i)};
h.$=function(){return this.c[this.i]};h.ka=function(){return this.i+1<this.c.length?new ad(this.c,this.i+1,null):L};h.M=function(){return this.i<this.c.length?this:null};h.I=function(a,b){return new ad(this.c,this.i,b)};h.T=function(a,b){return xd(b,this)};ad.prototype[Eb]=function(){return dd(this)};function R(a){return 0<a.length?new ad(a,0,null):null}function td(a,b,c){this.Lb=a;this.i=b;this.o=c;this.h=32374990;this.s=8192}h=td.prototype;h.toString=function(){return Nc(this)};
h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return 0<this.i?new td(this.Lb,this.i-1,null):null};h.P=function(){return this.i+1};h.N=function(){return fd(this)};h.v=function(a,b){return wd(this,b)};
h.X=function(){return hc(L,this.o)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return Rb.b(this.Lb,this.i)};h.ka=function(){return 0<this.i?new td(this.Lb,this.i-1,null):L};h.M=function(){return this};h.I=function(a,b){return new td(this.Lb,this.i,b)};h.T=function(a,b){return xd(b,this)};td.prototype[Eb]=function(){return dd(this)};function Ad(a){return K(M(a))}function Bd(a){for(;;){var b=M(a);if(null!=b)a=b;else return K(a)}}
nc._=function(a,b){return a===b};var Cd=function Cd(b){switch(arguments.length){case 0:return Cd.m();case 1:return Cd.a(arguments[0]);case 2:return Cd.b(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Cd.l(arguments[0],arguments[1],new ad(c.slice(2),0,null))}};Cd.m=function(){return Dd};Cd.a=function(a){return a};Cd.b=function(a,b){return null!=a?Pb(a,b):Pb(L,b)};
Cd.l=function(a,b,c){for(;;)if(w(c))a=Cd.b(a,b),b=K(c),c=M(c);else return Cd.b(a,b)};Cd.F=function(a){var b=K(a),c=M(a);a=K(c);c=M(c);return Cd.l(b,a,c)};Cd.B=2;function Ed(a){return null==a?null:Mb(a)}function Q(a){if(null!=a)if(null!=a&&(a.h&2||r===a.Qc))a=a.P(null);else if(zb(a))a=a.length;else if("string"===typeof a)a=a.length;else if(null!=a&&(a.h&8388608||r===a.$c))a:{a=H(a);for(var b=0;;){if(od(a)){a=b+Lb(a);break a}a=M(a);b+=1}}else a=Lb(a);else a=0;return a}
function Fd(a,b){for(var c=null;;){if(null==a)return c;if(0===b)return H(a)?K(a):c;if(pd(a))return Rb.f(a,b,c);if(H(a)){var d=M(a),e=b-1;a=d;b=e}else return c}}
function qd(a,b){if("number"!==typeof b)throw Error("Index argument to nth must be a number");if(null==a)return a;if(null!=a&&(a.h&16||r===a.oc))return a.L(null,b);if(zb(a)){if(0<=b&&b<a.length)return a[b];throw Error("Index out of bounds");}if("string"===typeof a){if(0<=b&&b<a.length)return a.charAt(b);throw Error("Index out of bounds");}if(null!=a&&(a.h&64||r===a.Z)){a:{var c=a;for(var d=b;;){if(null==c)throw Error("Index out of bounds");if(0===d){if(H(c)){c=K(c);break a}throw Error("Index out of bounds");
}if(pd(c)){c=Rb.b(c,d);break a}if(H(c))c=M(c),--d;else throw Error("Index out of bounds");}}return c}if(A(Qb,a))return Rb.b(a,b);throw Error([C.a("nth not supported on this type "),C.a(Db(Cb(a)))].join(""));}
function T(a,b){if("number"!==typeof b)throw Error("Index argument to nth must be a number.");if(null==a)return null;if(null!=a&&(a.h&16||r===a.oc))return a.ua(null,b,null);if(zb(a))return 0<=b&&b<a.length?a[b]:null;if("string"===typeof a)return 0<=b&&b<a.length?a.charAt(b):null;if(null!=a&&(a.h&64||r===a.Z))return Fd(a,b);if(A(Qb,a))return Rb.f(a,b,null);throw Error([C.a("nth not supported on this type "),C.a(Db(Cb(a)))].join(""));}
var G=function G(b){switch(arguments.length){case 2:return G.b(arguments[0],arguments[1]);case 3:return G.f(arguments[0],arguments[1],arguments[2]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};G.b=function(a,b){return null==a?null:null!=a&&(a.h&256||r===a.Wc)?a.S(null,b):zb(a)?null!=b&&b<a.length?a[b|0]:null:"string"===typeof a?null!=b&&b<a.length?a.charAt(b|0):null:A(Vb,a)?Wb.b(a,b):null};
G.f=function(a,b,c){return null!=a?null!=a&&(a.h&256||r===a.Wc)?a.H(null,b,c):zb(a)?null!=b&&0<=b&&b<a.length?a[b|0]:c:"string"===typeof a?null!=b&&0<=b&&b<a.length?a.charAt(b|0):c:A(Vb,a)?Wb.f(a,b,c):c:c};G.B=3;var Gd=function Gd(b){switch(arguments.length){case 3:return Gd.f(arguments[0],arguments[1],arguments[2]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Gd.l(arguments[0],arguments[1],arguments[2],new ad(c.slice(3),0,null))}};
Gd.f=function(a,b,c){return null!=a?Yb(a,b,c):Hd([b,c])};Gd.l=function(a,b,c,d){for(;;)if(a=Gd.f(a,b,c),w(d))b=K(d),c=Ad(d),d=M(M(d));else return a};Gd.F=function(a){var b=K(a),c=M(a);a=K(c);var d=M(c);c=K(d);d=M(d);return Gd.l(b,a,c,d)};Gd.B=3;function Id(a,b){this.g=a;this.o=b;this.h=393217;this.s=0}h=Id.prototype;h.G=function(){return this.o};h.I=function(a,b){return new Id(this.g,b)};h.Pc=r;
h.call=function(){function a(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N,J,da){return Jd(this.g,b,c,d,e,R([f,g,k,l,m,n,p,y,t,u,z,x,D,I,N,J,da]))}function b(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N,J){a=this;return a.g.Ua?a.g.Ua(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N,J):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N,J)}function c(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N){a=this;return a.g.Ta?a.g.Ta(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I,N)}function d(a,
b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I){a=this;return a.g.Sa?a.g.Sa(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D,I)}function e(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D){a=this;return a.g.Ra?a.g.Ra(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x,D)}function f(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x){a=this;return a.g.Qa?a.g.Qa(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z,x)}function g(a,b,c,d,e,f,g,k,l,m,n,p,
y,t,u,z){a=this;return a.g.Pa?a.g.Pa(b,c,d,e,f,g,k,l,m,n,p,y,t,u,z):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u,z)}function k(a,b,c,d,e,f,g,k,l,m,n,p,y,t,u){a=this;return a.g.Oa?a.g.Oa(b,c,d,e,f,g,k,l,m,n,p,y,t,u):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t,u)}function l(a,b,c,d,e,f,g,k,l,m,n,p,y,t){a=this;return a.g.Na?a.g.Na(b,c,d,e,f,g,k,l,m,n,p,y,t):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p,y,t)}function m(a,b,c,d,e,f,g,k,l,m,n,p,y){a=this;return a.g.Ma?a.g.Ma(b,c,d,e,f,g,k,l,m,n,p,y):a.g.call(null,b,c,d,
e,f,g,k,l,m,n,p,y)}function n(a,b,c,d,e,f,g,k,l,m,n,p){a=this;return a.g.La?a.g.La(b,c,d,e,f,g,k,l,m,n,p):a.g.call(null,b,c,d,e,f,g,k,l,m,n,p)}function p(a,b,c,d,e,f,g,k,l,m,n){a=this;return a.g.Ka?a.g.Ka(b,c,d,e,f,g,k,l,m,n):a.g.call(null,b,c,d,e,f,g,k,l,m,n)}function u(a,b,c,d,e,f,g,k,l,m){a=this;return a.g.Xa?a.g.Xa(b,c,d,e,f,g,k,l,m):a.g.call(null,b,c,d,e,f,g,k,l,m)}function t(a,b,c,d,e,f,g,k,l){a=this;return a.g.Wa?a.g.Wa(b,c,d,e,f,g,k,l):a.g.call(null,b,c,d,e,f,g,k,l)}function z(a,b,c,d,e,f,
g,k){a=this;return a.g.Va?a.g.Va(b,c,d,e,f,g,k):a.g.call(null,b,c,d,e,f,g,k)}function x(a,b,c,d,e,f,g){a=this;return a.g.ga?a.g.ga(b,c,d,e,f,g):a.g.call(null,b,c,d,e,f,g)}function y(a,b,c,d,e,f){a=this;return a.g.R?a.g.R(b,c,d,e,f):a.g.call(null,b,c,d,e,f)}function D(a,b,c,d,e){a=this;return a.g.w?a.g.w(b,c,d,e):a.g.call(null,b,c,d,e)}function I(a,b,c,d){a=this;return a.g.f?a.g.f(b,c,d):a.g.call(null,b,c,d)}function N(a,b,c){a=this;return a.g.b?a.g.b(b,c):a.g.call(null,b,c)}function S(a,b){a=this;
return a.g.a?a.g.a(b):a.g.call(null,b)}function da(a){a=this;return a.g.m?a.g.m():a.g.call(null)}var J=null;J=function(J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc,ud,vd,Yd,We,Xe){switch(arguments.length){case 1:return da.call(this,J);case 2:return S.call(this,J,ea);case 3:return N.call(this,J,ea,ca);case 4:return I.call(this,J,ea,ca,qa);case 5:return D.call(this,J,ea,ca,qa,oa);case 6:return y.call(this,J,ea,ca,qa,oa,ua);case 7:return x.call(this,J,ea,ca,qa,oa,ua,Ja);case 8:return z.call(this,
J,ea,ca,qa,oa,ua,Ja,pa);case 9:return t.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y);case 10:return u.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta);case 11:return p.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb);case 12:return n.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya);case 13:return m.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma);case 14:return l.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra);case 15:return k.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za);case 16:return g.call(this,J,ea,ca,qa,oa,ua,
Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb);case 17:return f.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc);case 18:return e.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc,ud);case 19:return d.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc,ud,vd);case 20:return c.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc,ud,vd,Yd);case 21:return b.call(this,J,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,Ya,Ma,Ra,Za,Nb,mc,ud,vd,Yd,We);case 22:return a.call(this,0,ea,ca,qa,oa,ua,Ja,pa,Y,ta,eb,
Ya,Ma,Ra,Za,Nb,mc,ud,vd,Yd,We,Xe)}throw Error("Invalid arity: "+(arguments.length-1));};J.a=da;J.b=S;J.f=N;J.w=I;J.R=D;J.ga=y;J.Va=x;J.Wa=z;J.Xa=t;J.Ka=u;J.La=p;J.Ma=n;J.Na=m;J.Oa=l;J.Pa=k;J.Qa=g;J.Ra=f;J.Sa=e;J.Ta=d;J.Ua=c;J.Vc=b;J.Xd=a;return J}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.m=function(){return this.g.m?this.g.m():this.g.call(null)};h.a=function(a){return this.g.a?this.g.a(a):this.g.call(null,a)};
h.b=function(a,b){return this.g.b?this.g.b(a,b):this.g.call(null,a,b)};h.f=function(a,b,c){return this.g.f?this.g.f(a,b,c):this.g.call(null,a,b,c)};h.w=function(a,b,c,d){return this.g.w?this.g.w(a,b,c,d):this.g.call(null,a,b,c,d)};h.R=function(a,b,c,d,e){return this.g.R?this.g.R(a,b,c,d,e):this.g.call(null,a,b,c,d,e)};h.ga=function(a,b,c,d,e,f){return this.g.ga?this.g.ga(a,b,c,d,e,f):this.g.call(null,a,b,c,d,e,f)};
h.Va=function(a,b,c,d,e,f,g){return this.g.Va?this.g.Va(a,b,c,d,e,f,g):this.g.call(null,a,b,c,d,e,f,g)};h.Wa=function(a,b,c,d,e,f,g,k){return this.g.Wa?this.g.Wa(a,b,c,d,e,f,g,k):this.g.call(null,a,b,c,d,e,f,g,k)};h.Xa=function(a,b,c,d,e,f,g,k,l){return this.g.Xa?this.g.Xa(a,b,c,d,e,f,g,k,l):this.g.call(null,a,b,c,d,e,f,g,k,l)};h.Ka=function(a,b,c,d,e,f,g,k,l,m){return this.g.Ka?this.g.Ka(a,b,c,d,e,f,g,k,l,m):this.g.call(null,a,b,c,d,e,f,g,k,l,m)};
h.La=function(a,b,c,d,e,f,g,k,l,m,n){return this.g.La?this.g.La(a,b,c,d,e,f,g,k,l,m,n):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n)};h.Ma=function(a,b,c,d,e,f,g,k,l,m,n,p){return this.g.Ma?this.g.Ma(a,b,c,d,e,f,g,k,l,m,n,p):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p)};h.Na=function(a,b,c,d,e,f,g,k,l,m,n,p,u){return this.g.Na?this.g.Na(a,b,c,d,e,f,g,k,l,m,n,p,u):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u)};
h.Oa=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t){return this.g.Oa?this.g.Oa(a,b,c,d,e,f,g,k,l,m,n,p,u,t):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t)};h.Pa=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z){return this.g.Pa?this.g.Pa(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z)};h.Qa=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x){return this.g.Qa?this.g.Qa(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x)};
h.Ra=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y){return this.g.Ra?this.g.Ra(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y)};h.Sa=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D){return this.g.Sa?this.g.Sa(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D)};
h.Ta=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I){return this.g.Ta?this.g.Ta(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I)};h.Ua=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N){return this.g.Ua?this.g.Ua(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N):this.g.call(null,a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N)};h.Vc=function(a,b,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N,S){return Jd(this.g,a,b,c,d,R([e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N,S]))};
function Kd(a){var b=null!=a;return(b?null!=a?a.h&131072||r===a.ac||(a.h?0:A(fc,a)):A(fc,a):b)?gc(a):null}function Ld(a){return null==a||Ab(H(a))}function Md(a){return null==a?!1:null!=a?a.h&8||r===a.Ud?!0:a.h?!1:A(Ob,a):A(Ob,a)}function Nd(a){return null==a?!1:null!=a?a.h&4096||r===a.fe?!0:a.h?!1:A(cc,a):A(cc,a)}function Pd(a){return null!=a?a.h&16777216||r===a.ee?!0:a.h?!1:A(rc,a):A(rc,a)}function Qd(a){return null==a?!1:null!=a?a.h&1024||r===a.be?!0:a.h?!1:A(Zb,a):A(Zb,a)}
function Rd(a){return null!=a?a.h&67108864||r===a.ce?!0:a.h?!1:A(tc,a):A(tc,a)}function Sd(a){return null!=a?a.h&16384||r===a.ge?!0:a.h?!1:A(dc,a):A(dc,a)}function Td(a){return null!=a?a.s&512||r===a.Td?!0:!1:!1}function Ud(a){var b=[];Aa(a,function(a,b){return function(a,c){return b.push(c)}}(a,b));return b}function Vd(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,--e,b+=1}var Wd={};function Xd(a){return!0===a||!1===a}function Zd(a){return null==a?!1:null!=a?a.h&64||r===a.Z?!0:a.h?!1:A(Sb,a):A(Sb,a)}
function $d(a){return null==a?!1:!1===a?!1:!0}function ae(a,b){return G.f(a,b,Wd)===Wd?!1:!0}var be=function be(b){switch(arguments.length){case 1:return be.a(arguments[0]);case 2:return be.b(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return be.l(arguments[0],arguments[1],new ad(c.slice(2),0,null))}};be.a=function(){return!0};be.b=function(a,b){return!O.b(a,b)};
be.l=function(a,b,c){if(O.b(a,b))return!1;a=[a,b];b=a.length;for(var d=yc(ce),e=0;;)if(e<b)zc(d,a[e]),e+=1;else break;a=Ac(d);for(b=c;;)if(d=K(b),c=M(b),w(b)){if(ae(a,d))return!1;a=Cd.b(a,d);b=c}else return!0};be.F=function(a){var b=K(a),c=M(a);a=K(c);c=M(c);return be.l(b,a,c)};be.B=2;
function de(a,b){if(a===b)return 0;if(null==a)return-1;if(null==b)return 1;if("number"===typeof a){if("number"===typeof b)return sa(a,b);throw Error([C.a("Cannot compare "),C.a(a),C.a(" to "),C.a(b)].join(""));}if(null!=a?a.s&2048||r===a.Ob||(a.s?0:A(Cc,a)):A(Cc,a))return Dc(a,b);if("string"!==typeof a&&!zb(a)&&!0!==a&&!1!==a||Cb(a)!==Cb(b))throw Error([C.a("Cannot compare "),C.a(a),C.a(" to "),C.a(b)].join(""));return sa(a,b)}
function ee(a){return O.b(a,de)?de:function(b,c){var d=a.b?a.b(b,c):a.call(null,b,c);return"number"===typeof d?d:w(d)?-1:w(a.b?a.b(c,b):a.call(null,c,b))?1:0}}function fe(a,b){if(H(b)){a:{var c=[];for(var d=H(b);;)if(null!=d)c.push(K(d)),d=M(d);else break a}d=ee(a);va(c,d);return H(c)}return L}function ge(a,b){return he(a,b)}function he(a,b){return fe(function(b,d){var c=a.a?a.a(b):a.call(null,b),f=a.a?a.a(d):a.call(null,d),g=ee(de);return g.b?g.b(c,f):g.call(null,c,f)},b)}
function yd(a,b){var c=H(b);return c?Hb(a,K(c),M(c)):a.m?a.m():a.call(null)}function zd(a,b,c){for(c=H(c);;)if(c){var d=K(c);b=a.b?a.b(b,d):a.call(null,b,d);if(kd(b))return ec(b);c=M(c)}else return b}function ie(a,b){var c=Lc(a);if(w(c.aa()))for(var d=c.next();;)if(c.aa()){var e=c.next();d=b.b?b.b(d,e):b.call(null,d,e);if(kd(d))return ec(d)}else return d;else return b.m?b.m():b.call(null)}
function je(a,b,c){for(a=Lc(a);;)if(a.aa()){var d=a.next();c=b.b?b.b(c,d):b.call(null,c,d);if(kd(c))return ec(c)}else return c}function ke(a,b){return null!=b&&(b.h&524288||r===b.Yc)?b.da(null,a):zb(b)?ld(b,a):"string"===typeof b?ld(b,a):A(ic,b)?jc.b(b,a):$c(b)?ie(b,a):yd(a,b)}function Hb(a,b,c){return null!=c&&(c.h&524288||r===c.Yc)?c.ea(null,a,b):zb(c)?md(c,a,b):"string"===typeof c?md(c,a,b):A(ic,c)?jc.f(c,a,b):$c(c)?je(c,a,b):zd(a,b,c)}function le(a,b){return null!=b?lc(b,a,!0):!0}
function me(a){return a}function ne(a,b,c,d){a=a.a?a.a(b):a.call(null,b);c=Hb(a,c,d);return a.a?a.a(c):a.call(null,c)}function oe(a){return 0<=a?Math.floor(a):Math.ceil(a)}function pe(a){return oe((a-a%2)/2)}function qe(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}
var C=function C(b){switch(arguments.length){case 0:return C.m();case 1:return C.a(arguments[0]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return C.l(arguments[0],new ad(c.slice(1),0,null))}};C.m=function(){return""};C.a=function(a){return null==a?"":""+a};C.l=function(a,b){for(var c=new mb(""+C.a(a)),d=b;;)if(w(d))c=c.append(""+C.a(K(d))),d=M(d);else return c.toString()};C.F=function(a){var b=K(a);a=M(a);return C.l(b,a)};C.B=1;
function wd(a,b){if(Pd(b))if(od(a)&&od(b)&&Q(a)!==Q(b))var c=!1;else a:{c=H(a);for(var d=H(b);;){if(null==c){c=null==d;break a}if(null!=d&&O.b(K(c),K(d)))c=M(c),d=M(d);else{c=!1;break a}}}else c=null;return $d(c)}function re(a,b,c,d,e){this.o=a;this.first=b;this.ab=c;this.count=d;this.u=e;this.h=65937646;this.s=8192}h=re.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,this.count)}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return 1===this.count?null:this.ab};h.P=function(){return this.count};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};
h.X=function(){return hc(L,this.o)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return this.first};h.ka=function(){return 1===this.count?L:this.ab};h.M=function(){return this};h.I=function(a,b){return new re(b,this.first,this.ab,this.count,this.u)};h.T=function(a,b){return new re(this.o,b,this,this.count+1,null)};function se(a){return null!=a?a.h&33554432||r===a.ae?!0:a.h?!1:A(sc,a):A(sc,a)}re.prototype[Eb]=function(){return dd(this)};
function te(a){this.o=a;this.h=65937614;this.s=8192}h=te.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return null};h.P=function(){return 0};h.N=function(){return gd};h.v=function(a,b){return se(b)||Pd(b)?null==H(b):!1};h.X=function(){return this};
h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return null};h.ka=function(){return L};h.M=function(){return null};h.I=function(a,b){return new te(b)};h.T=function(a,b){return new re(this.o,b,null,1,null)};var L=new te(null);te.prototype[Eb]=function(){return dd(this)};function ue(a){return(null!=a?a.h&134217728||r===a.de||(a.h?0:A(uc,a)):A(uc,a))?vc(a):Hb(Cd,L,a)}
var U=function U(b){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return U.l(0<c.length?new ad(c.slice(0),0,null):null)};U.l=function(a){if(a instanceof ad&&0===a.i)var b=a.c;else a:for(b=[];;)if(null!=a)b.push(a.$(null)),a=a.Y(null);else break a;a=b.length;for(var c=L;;)if(0<a){var d=a-1;c=c.T(null,b[a-1]);a=d}else return c};U.B=0;U.F=function(a){return U.l(H(a))};function ve(a,b,c,d){this.o=a;this.first=b;this.ab=c;this.u=d;this.h=65929452;this.s=8192}h=ve.prototype;
h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return null==this.ab?null:H(this.ab)};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.o)};
h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return this.first};h.ka=function(){return null==this.ab?L:this.ab};h.M=function(){return this};h.I=function(a,b){return new ve(b,this.first,this.ab,this.u)};h.T=function(a,b){return new ve(null,b,this,null)};ve.prototype[Eb]=function(){return dd(this)};function xd(a,b){return null==b||null!=b&&(b.h&64||r===b.Z)?new ve(null,a,b,null):new ve(null,a,H(b),null)}
function we(a,b){if(a.Fa===b.Fa)return 0;var c=Ab(a.ia);if(w(c?b.ia:c))return-1;if(w(a.ia)){if(Ab(b.ia))return 1;c=sa(a.ia,b.ia);return 0===c?sa(a.name,b.name):c}return sa(a.name,b.name)}function V(a,b,c,d){this.ia=a;this.name=b;this.Fa=c;this.qb=d;this.h=2153775105;this.s=4096}h=V.prototype;h.toString=function(){return[C.a(":"),C.a(this.Fa)].join("")};h.equiv=function(a){return this.v(null,a)};h.v=function(a,b){return b instanceof V?this.Fa===b.Fa:!1};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return G.b(c,this);case 3:return G.f(c,this,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return G.b(c,this)};a.f=function(a,c,d){return G.f(c,this,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return G.b(a,this)};h.b=function(a,b){return G.f(a,this,b)};
h.N=function(){var a=this.qb;return null!=a?a:this.qb=a=Xc(Sc(this.name),Vc(this.ia))+2654435769|0};h.O=function(a,b){return wc(b,[C.a(":"),C.a(this.Fa)].join(""))};function xe(a,b){return a===b?!0:a instanceof V&&b instanceof V?a.Fa===b.Fa:!1}function ye(a){if(null!=a&&(a.s&4096||r===a.Xc))return a.ia;throw Error([C.a("Doesn't support namespace: "),C.a(a)].join(""));}function ze(a){return a instanceof V||a instanceof F}
var Ae=function Ae(b){switch(arguments.length){case 1:return Ae.a(arguments[0]);case 2:return Ae.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};Ae.a=function(a){if(a instanceof V)return a;if(a instanceof F)return new V(ye(a),Be(a),a.Ia,null);if("string"===typeof a){var b=a.split("/");return 2===b.length?new V(b[0],b[1],a,null):new V(null,b[0],a,null)}return null};
Ae.b=function(a,b){var c=a instanceof V?Be(a):a instanceof F?Be(a):a,d=b instanceof V?Be(b):b instanceof F?Be(b):b;return new V(c,d,[C.a(w(c)?[C.a(c),C.a("/")].join(""):null),C.a(d)].join(""),null)};Ae.B=2;function Ce(a,b,c,d){this.o=a;this.wb=b;this.A=c;this.u=d;this.h=32374988;this.s=1}h=Ce.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};function De(a){null!=a.wb&&(a.A=a.wb.m?a.wb.m():a.wb.call(null),a.wb=null);return a.A}
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){this.M(null);return null==this.A?null:M(this.A)};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};
h.X=function(){return hc(L,this.o)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){this.M(null);return null==this.A?null:K(this.A)};h.ka=function(){this.M(null);return null!=this.A?bd(this.A):L};h.M=function(){De(this);if(null==this.A)return null;for(var a=this.A;;)if(a instanceof Ce)a=De(a);else return this.A=a,H(this.A)};h.I=function(a,b){return new Ce(b,this.wb,this.A,this.u)};h.T=function(a,b){return xd(b,this)};Ce.prototype[Eb]=function(){return dd(this)};
function Ee(a,b){this.D=a;this.end=b;this.h=2;this.s=0}Ee.prototype.add=function(a){this.D[this.end]=a;return this.end+=1};Ee.prototype.qa=function(){var a=new Fe(this.D,0,this.end);this.D=null;return a};Ee.prototype.P=function(){return this.end};function Fe(a,b,c){this.c=a;this.ba=b;this.end=c;this.h=524306;this.s=0}h=Fe.prototype;h.P=function(){return this.end-this.ba};h.L=function(a,b){return this.c[this.ba+b]};h.ua=function(a,b,c){return 0<=b&&b<this.end-this.ba?this.c[this.ba+b]:c};
h.mc=function(){if(this.ba===this.end)throw Error("-drop-first of empty chunk");return new Fe(this.c,this.ba+1,this.end)};h.da=function(a,b){return nd(this.c,b,this.c[this.ba],this.ba+1)};h.ea=function(a,b,c){return nd(this.c,b,c,this.ba)};function Ge(a,b,c,d){this.qa=a;this.Ha=b;this.o=c;this.u=d;this.h=31850732;this.s=1536}h=Ge.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){if(1<Lb(this.qa))return new Ge(Ec(this.qa),this.Ha,this.o,null);var a=qc(this.Ha);return null==a?null:a};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};
h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.o)};h.$=function(){return Rb.b(this.qa,0)};h.ka=function(){return 1<Lb(this.qa)?new Ge(Ec(this.qa),this.Ha,this.o,null):null==this.Ha?L:this.Ha};h.M=function(){return this};h.$b=function(){return this.qa};h.Nb=function(){return null==this.Ha?L:this.Ha};h.I=function(a,b){return new Ge(this.qa,this.Ha,b,this.u)};h.T=function(a,b){return xd(b,this)};h.nc=function(){return null==this.Ha?null:this.Ha};Ge.prototype[Eb]=function(){return dd(this)};
function He(a,b){return 0===Lb(a)?b:new Ge(a,b,null,null)}function Ie(a,b){a.add(b)}function Je(a,b){if(od(b))return Q(b);for(var c=0,d=H(b);;)if(null!=d&&c<a)c+=1,d=M(d);else return c}
var Ke=function Ke(b){if(null==b)return null;var c=M(b);return null==c?H(K(b)):xd(K(b),Ke.a?Ke.a(c):Ke.call(null,c))},Le=function Le(b){switch(arguments.length){case 0:return Le.m();case 1:return Le.a(arguments[0]);case 2:return Le.b(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Le.l(arguments[0],arguments[1],new ad(c.slice(2),0,null))}};Le.m=function(){return new Ce(null,function(){return null},null,null)};
Le.a=function(a){return new Ce(null,function(){return a},null,null)};Le.b=function(a,b){return new Ce(null,function(){var c=H(a);return c?Td(c)?He(Fc(c),Le.b(Gc(c),b)):xd(K(c),Le.b(bd(c),b)):b},null,null)};Le.l=function(a,b,c){return function e(a,b){return new Ce(null,function(){var c=H(a);return c?Td(c)?He(Fc(c),e(Gc(c),b)):xd(K(c),e(bd(c),b)):w(b)?e(K(b),M(b)):null},null,null)}(Le.b(a,b),c)};Le.F=function(a){var b=K(a),c=M(a);a=K(c);c=M(c);return Le.l(b,a,c)};Le.B=2;
var Me=function Me(b){switch(arguments.length){case 0:return Me.m();case 1:return Me.a(arguments[0]);case 2:return Me.b(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Me.l(arguments[0],arguments[1],new ad(c.slice(2),0,null))}};Me.m=function(){return yc(Dd)};Me.a=function(a){return a};Me.b=function(a,b){return zc(a,b)};Me.l=function(a,b,c){for(;;)if(a=zc(a,b),w(c))b=K(c),c=M(c);else return a};
Me.F=function(a){var b=K(a),c=M(a);a=K(c);c=M(c);return Me.l(b,a,c)};Me.B=2;
function Ne(a,b,c){var d=H(c);if(0===b)return a.m?a.m():a.call(null);c=E(d);var e=Tb(d);if(1===b)return a.a?a.a(c):a.call(null,c);d=E(e);var f=Tb(e);if(2===b)return a.b?a.b(c,d):a.call(null,c,d);e=E(f);var g=Tb(f);if(3===b)return a.f?a.f(c,d,e):a.call(null,c,d,e);f=E(g);var k=Tb(g);if(4===b)return a.w?a.w(c,d,e,f):a.call(null,c,d,e,f);g=E(k);var l=Tb(k);if(5===b)return a.R?a.R(c,d,e,f,g):a.call(null,c,d,e,f,g);k=E(l);var m=Tb(l);if(6===b)return a.ga?a.ga(c,d,e,f,g,k):a.call(null,c,d,e,f,g,k);l=E(m);
var n=Tb(m);if(7===b)return a.Va?a.Va(c,d,e,f,g,k,l):a.call(null,c,d,e,f,g,k,l);m=E(n);var p=Tb(n);if(8===b)return a.Wa?a.Wa(c,d,e,f,g,k,l,m):a.call(null,c,d,e,f,g,k,l,m);n=E(p);var u=Tb(p);if(9===b)return a.Xa?a.Xa(c,d,e,f,g,k,l,m,n):a.call(null,c,d,e,f,g,k,l,m,n);p=E(u);var t=Tb(u);if(10===b)return a.Ka?a.Ka(c,d,e,f,g,k,l,m,n,p):a.call(null,c,d,e,f,g,k,l,m,n,p);u=E(t);var z=Tb(t);if(11===b)return a.La?a.La(c,d,e,f,g,k,l,m,n,p,u):a.call(null,c,d,e,f,g,k,l,m,n,p,u);t=E(z);var x=Tb(z);if(12===b)return a.Ma?
a.Ma(c,d,e,f,g,k,l,m,n,p,u,t):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t);z=E(x);var y=Tb(x);if(13===b)return a.Na?a.Na(c,d,e,f,g,k,l,m,n,p,u,t,z):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z);x=E(y);var D=Tb(y);if(14===b)return a.Oa?a.Oa(c,d,e,f,g,k,l,m,n,p,u,t,z,x):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x);y=E(D);var I=Tb(D);if(15===b)return a.Pa?a.Pa(c,d,e,f,g,k,l,m,n,p,u,t,z,x,y):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y);D=E(I);var N=Tb(I);if(16===b)return a.Qa?a.Qa(c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D):a.call(null,
c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D);I=E(N);var S=Tb(N);if(17===b)return a.Ra?a.Ra(c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I);N=E(S);var da=Tb(S);if(18===b)return a.Sa?a.Sa(c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N);S=E(da);da=Tb(da);if(19===b)return a.Ta?a.Ta(c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N,S):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N,S);var J=E(da);Tb(da);if(20===b)return a.Ua?a.Ua(c,d,e,f,g,k,l,m,n,p,u,t,z,
x,y,D,I,N,S,J):a.call(null,c,d,e,f,g,k,l,m,n,p,u,t,z,x,y,D,I,N,S,J);throw Error("Only up to 20 arguments supported on functions");}function Oe(a,b,c){return null==c?a.a?a.a(b):a.call(a,b):Pe(a,b,E(c),M(c))}function Pe(a,b,c,d){return null==d?a.b?a.b(b,c):a.call(a,b,c):Qe(a,b,c,E(d),M(d))}function Qe(a,b,c,d,e){return null==e?a.f?a.f(b,c,d):a.call(a,b,c,d):Re(a,b,c,d,E(e),M(e))}
function Re(a,b,c,d,e,f){if(null==f)return a.w?a.w(b,c,d,e):a.call(a,b,c,d,e);var g=E(f),k=M(f);if(null==k)return a.R?a.R(b,c,d,e,g):a.call(a,b,c,d,e,g);f=E(k);var l=M(k);if(null==l)return a.ga?a.ga(b,c,d,e,g,f):a.call(a,b,c,d,e,g,f);k=E(l);var m=M(l);if(null==m)return a.Va?a.Va(b,c,d,e,g,f,k):a.call(a,b,c,d,e,g,f,k);l=E(m);var n=M(m);if(null==n)return a.Wa?a.Wa(b,c,d,e,g,f,k,l):a.call(a,b,c,d,e,g,f,k,l);m=E(n);var p=M(n);if(null==p)return a.Xa?a.Xa(b,c,d,e,g,f,k,l,m):a.call(a,b,c,d,e,g,f,k,l,m);
n=E(p);var u=M(p);if(null==u)return a.Ka?a.Ka(b,c,d,e,g,f,k,l,m,n):a.call(a,b,c,d,e,g,f,k,l,m,n);p=E(u);var t=M(u);if(null==t)return a.La?a.La(b,c,d,e,g,f,k,l,m,n,p):a.call(a,b,c,d,e,g,f,k,l,m,n,p);u=E(t);var z=M(t);if(null==z)return a.Ma?a.Ma(b,c,d,e,g,f,k,l,m,n,p,u):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u);t=E(z);var x=M(z);if(null==x)return a.Na?a.Na(b,c,d,e,g,f,k,l,m,n,p,u,t):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t);z=E(x);var y=M(x);if(null==y)return a.Oa?a.Oa(b,c,d,e,g,f,k,l,m,n,p,u,t,z):a.call(a,b,c,d,
e,g,f,k,l,m,n,p,u,t,z);x=E(y);var D=M(y);if(null==D)return a.Pa?a.Pa(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t,z,x);y=E(D);var I=M(D);if(null==I)return a.Qa?a.Qa(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y);D=E(I);var N=M(I);if(null==N)return a.Ra?a.Ra(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D);I=E(N);var S=M(N);if(null==S)return a.Sa?a.Sa(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,
t,z,x,y,D,I);N=E(S);var da=M(S);if(null==da)return a.Ta?a.Ta(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I,N):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I,N);S=E(da);da=M(da);if(null==da)return a.Ua?a.Ua(b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I,N,S):a.call(a,b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I,N,S);b=[b,c,d,e,g,f,k,l,m,n,p,u,t,z,x,y,D,I,N,S];for(c=da;;)if(c)b.push(E(c)),c=M(c);else break;return a.apply(a,b)}
function Se(a,b){if(a.F){var c=a.B,d=Je(c+1,b);return d<=c?Ne(a,d,b):a.F(b)}c=H(b);return null==c?a.m?a.m():a.call(a):Oe(a,E(c),M(c))}function Te(a,b,c){if(a.F){b=xd(b,c);var d=a.B;c=Je(d,c)+1;return c<=d?Ne(a,c,b):a.F(b)}return Oe(a,b,H(c))}function Jd(a,b,c,d,e,f){return a.F?(f=Ke(f),b=xd(b,xd(c,xd(d,xd(e,f)))),c=a.B,f=4+Je(c-3,f),f<=c?Ne(a,f,b):a.F(b)):Re(a,b,c,d,e,Ke(f))}function Ue(a,b){return!O.b(a,b)}function Ve(a){return H(a)?a:null}
function Ye(){"undefined"===typeof nb&&(nb=function(a){this.td=a;this.h=393216;this.s=0},nb.prototype.I=function(a,b){return new nb(b)},nb.prototype.G=function(){return this.td},nb.prototype.aa=function(){return!1},nb.prototype.next=function(){return Error("No such element")},nb.prototype.remove=function(){return Error("Unsupported operation")},nb.Ga=function(){return new W(null,1,5,X,[Ze],null)},nb.va=!0,nb.pa="cljs.core/t_cljs$core34145",nb.ya=function(a,b){return wc(b,"cljs.core/t_cljs$core34145")});
return new nb($e)}function af(a){return Zd(a)?a:(a=H(a))?a:L}function bf(a,b){for(;;){if(null==H(b))return!0;var c=K(b);c=a.a?a.a(c):a.call(null,c);if(w(c)){c=a;var d=M(b);a=c;b=d}else return!1}}function cf(a,b){for(;;)if(H(b)){var c=K(b);c=a.a?a.a(c):a.call(null,c);if(w(c))return c;c=a;var d=M(b);a=c;b=d}else return null}
function df(a){return function(){function b(b,c){return Ab(a.b?a.b(b,c):a.call(null,b,c))}function c(b){return Ab(a.a?a.a(b):a.call(null,b))}function d(){return Ab(a.m?a.m():a.call(null))}var e=null,f=function(){function b(a,b,d){var e=null;if(2<arguments.length){e=0;for(var f=Array(arguments.length-2);e<f.length;)f[e]=arguments[e+2],++e;e=new ad(f,0,null)}return c.call(this,a,b,e)}function c(b,c,d){a.F?(b=xd(b,xd(c,d)),c=a.B,d=2+Je(c-1,d),d=d<=c?Ne(a,d,b):a.F(b)):d=Pe(a,b,c,H(d));return Ab(d)}b.B=
2;b.F=function(a){var b=K(a);a=M(a);var d=K(a);a=bd(a);return c(b,d,a)};b.l=c;return b}();e=function(a,e,l){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,a);case 2:return b.call(this,a,e);default:var g=null;if(2<arguments.length){g=0;for(var k=Array(arguments.length-2);g<k.length;)k[g]=arguments[g+2],++g;g=new ad(k,0,null)}return f.l(a,e,g)}throw Error("Invalid arity: "+(arguments.length-1));};e.B=2;e.F=f.F;e.m=d;e.a=c;e.b=b;e.l=f.l;return e}()}
function ef(){return function(){function a(a){if(0<arguments.length)for(var b=0,d=Array(arguments.length-0);b<d.length;)d[b]=arguments[b+0],++b;return!1}a.B=0;a.F=function(a){H(a);return!1};a.l=function(){return!1};return a}()}
function ff(a,b){return function(){function c(c,d,e){return a.w?a.w(b,c,d,e):a.call(null,b,c,d,e)}function d(c,d){return a.f?a.f(b,c,d):a.call(null,b,c,d)}function e(c){return a.b?a.b(b,c):a.call(null,b,c)}function f(){return a.a?a.a(b):a.call(null,b)}var g=null,k=function(){function c(a,b,c,e){var f=null;if(3<arguments.length){f=0;for(var g=Array(arguments.length-3);f<g.length;)g[f]=arguments[f+3],++f;f=new ad(g,0,null)}return d.call(this,a,b,c,f)}function d(c,d,e,f){return Jd(a,b,c,d,e,R([f]))}
c.B=3;c.F=function(a){var b=K(a);a=M(a);var c=K(a);a=M(a);var e=K(a);a=bd(a);return d(b,c,e,a)};c.l=d;return c}();g=function(a,b,g,p){switch(arguments.length){case 0:return f.call(this);case 1:return e.call(this,a);case 2:return d.call(this,a,b);case 3:return c.call(this,a,b,g);default:var l=null;if(3<arguments.length){l=0;for(var m=Array(arguments.length-3);l<m.length;)m[l]=arguments[l+3],++l;l=new ad(m,0,null)}return k.l(a,b,g,l)}throw Error("Invalid arity: "+(arguments.length-1));};g.B=3;g.F=k.F;
g.m=f;g.a=e;g.b=d;g.f=c;g.l=k.l;return g}()}function gf(a,b){return new Ce(null,function(){var c=H(b);if(c){if(Td(c)){for(var d=Fc(c),e=Q(d),f=new Ee(Array(e),0),g=0;;)if(g<e){var k=function(){var b=Rb.b(d,g);return a.a?a.a(b):a.call(null,b)}();null!=k&&f.add(k);g+=1}else break;return He(f.qa(),gf(a,Gc(c)))}e=function(){var b=K(c);return a.a?a.a(b):a.call(null,b)}();return null==e?gf(a,bd(c)):xd(e,gf(a,bd(c)))}return null},null,null)}
function hf(a,b,c,d){this.state=a;this.o=b;this.Sd=c;this.Nc=d;this.s=16386;this.h=6455296}h=hf.prototype;h.equiv=function(a){return this.v(null,a)};h.v=function(a,b){return this===b};h.sb=function(){return this.state};h.G=function(){return this.o};
h.rc=function(a,b,c){for(var d,e=H(this.Nc),f=null,g=0,k=0;;)if(k<g)d=f.L(null,k),a=T(d,0),d=T(d,1),d.w?d.w(a,this,b,c):d.call(null,a,this,b,c),k+=1;else if(a=H(e))e=a,Td(e)?(f=Fc(e),e=Gc(e),a=f,d=Q(f),f=a,g=d):(f=K(e),a=T(f,0),d=T(f,1),d.w?d.w(a,this,b,c):d.call(null,a,this,b,c),e=M(e),f=null,g=0),k=0;else return null};h.N=function(){return this[ha]||(this[ha]=++ia)};
function jf(a,b){if(a instanceof hf){var c=a.Sd;if(null!=c&&!w(c.a?c.a(b):c.call(null,b)))throw Error("Validator rejected reference state");c=a.state;a.state=b;null!=a.Nc&&xc(a,c,b);return b}return Hc(a,b)}
var kf=function kf(b){switch(arguments.length){case 2:return kf.b(arguments[0],arguments[1]);case 3:return kf.f(arguments[0],arguments[1],arguments[2]);case 4:return kf.w(arguments[0],arguments[1],arguments[2],arguments[3]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return kf.l(arguments[0],arguments[1],arguments[2],arguments[3],new ad(c.slice(4),0,null))}};
kf.b=function(a,b){if(a instanceof hf){var c=a.state;c=b.a?b.a(c):b.call(null,c);c=jf(a,c)}else c=Ic.b(a,b);return c};kf.f=function(a,b,c){if(a instanceof hf){var d=a.state;b=b.b?b.b(d,c):b.call(null,d,c);a=jf(a,b)}else a=Ic.f(a,b,c);return a};kf.w=function(a,b,c,d){if(a instanceof hf){var e=a.state;b=b.f?b.f(e,c,d):b.call(null,e,c,d);a=jf(a,b)}else a=Ic.w(a,b,c,d);return a};
kf.l=function(a,b,c,d,e){if(a instanceof hf){var f=a.state;b.F?(c=xd(f,xd(c,xd(d,e))),d=b.B,e=3+Je(d-2,e),b=e<=d?Ne(b,e,c):b.F(c)):b=Qe(b,f,c,d,H(e));a=jf(a,b)}else a=Ic.R(a,b,c,d,e);return a};kf.F=function(a){var b=K(a),c=M(a);a=K(c);var d=M(c);c=K(d);var e=M(d);d=K(e);e=M(e);return kf.l(b,a,c,d,e)};kf.B=4;function lf(a){this.state=a;this.h=32768;this.s=0}lf.prototype.qc=function(a,b){return this.state=b};lf.prototype.sb=function(){return this.state};
var Z=function Z(b){switch(arguments.length){case 1:return Z.a(arguments[0]);case 2:return Z.b(arguments[0],arguments[1]);case 3:return Z.f(arguments[0],arguments[1],arguments[2]);case 4:return Z.w(arguments[0],arguments[1],arguments[2],arguments[3]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Z.l(arguments[0],arguments[1],arguments[2],arguments[3],new ad(c.slice(4),0,null))}};
Z.a=function(a){return function(b){return function(){function c(c,d){var e=a.a?a.a(d):a.call(null,d);return b.b?b.b(c,e):b.call(null,c,e)}function d(a){return b.a?b.a(a):b.call(null,a)}function e(){return b.m?b.m():b.call(null)}var f=null,g=function(){function c(a,b,c){var e=null;if(2<arguments.length){e=0;for(var f=Array(arguments.length-2);e<f.length;)f[e]=arguments[e+2],++e;e=new ad(f,0,null)}return d.call(this,a,b,e)}function d(c,d,e){d=Te(a,d,e);return b.b?b.b(c,d):b.call(null,c,d)}c.B=2;c.F=
function(a){var b=K(a);a=M(a);var c=K(a);a=bd(a);return d(b,c,a)};c.l=d;return c}();f=function(a,b,f){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,b);default:var k=null;if(2<arguments.length){k=0;for(var l=Array(arguments.length-2);k<l.length;)l[k]=arguments[k+2],++k;k=new ad(l,0,null)}return g.l(a,b,k)}throw Error("Invalid arity: "+(arguments.length-1));};f.B=2;f.F=g.F;f.m=e;f.a=d;f.b=c;f.l=g.l;return f}()}};
Z.b=function(a,b){return new Ce(null,function(){var c=H(b);if(c){if(Td(c)){for(var d=Fc(c),e=Q(d),f=new Ee(Array(e),0),g=0;;)if(g<e)Ie(f,function(){var b=Rb.b(d,g);return a.a?a.a(b):a.call(null,b)}()),g+=1;else break;return He(f.qa(),Z.b(a,Gc(c)))}return xd(function(){var b=K(c);return a.a?a.a(b):a.call(null,b)}(),Z.b(a,bd(c)))}return null},null,null)};
Z.f=function(a,b,c){return new Ce(null,function(){var d=H(b),e=H(c);if(d&&e){var f=xd;var g=K(d);var k=K(e);g=a.b?a.b(g,k):a.call(null,g,k);d=f(g,Z.f(a,bd(d),bd(e)))}else d=null;return d},null,null)};Z.w=function(a,b,c,d){return new Ce(null,function(){var e=H(b),f=H(c),g=H(d);if(e&&f&&g){var k=xd;var l=K(e);var m=K(f),n=K(g);l=a.f?a.f(l,m,n):a.call(null,l,m,n);e=k(l,Z.w(a,bd(e),bd(f),bd(g)))}else e=null;return e},null,null)};
Z.l=function(a,b,c,d,e){var f=function k(a){return new Ce(null,function(){var b=Z.b(H,a);return bf(me,b)?xd(Z.b(K,b),k(Z.b(bd,b))):null},null,null)};return Z.b(function(){return function(b){return Se(a,b)}}(f),f(Cd.l(e,d,R([c,b]))))};Z.F=function(a){var b=K(a),c=M(a);a=K(c);var d=M(c);c=K(d);var e=M(d);d=K(e);e=M(e);return Z.l(b,a,c,d,e)};Z.B=4;
var mf=function mf(b){switch(arguments.length){case 1:return mf.a(arguments[0]);case 2:return mf.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};
mf.a=function(a){return function(b){return function(a){return function(){function c(c,d){var e=ec(a),f=Jc(a,ec(a)-1);e=0<e?b.b?b.b(c,d):b.call(null,c,d):c;return 0<f?e:kd(e)?e:new jd(e)}function e(a){return b.a?b.a(a):b.call(null,a)}function f(){return b.m?b.m():b.call(null)}var g=null;g=function(a,b){switch(arguments.length){case 0:return f.call(this);case 1:return e.call(this,a);case 2:return c.call(this,a,b)}throw Error("Invalid arity: "+(arguments.length-1));};g.m=f;g.a=e;g.b=c;return g}()}(new lf(a))}};
mf.b=function(a,b){return new Ce(null,function(){if(0<a){var c=H(b);return c?xd(K(c),mf.b(a-1,bd(c))):null}return null},null,null)};mf.B=2;function nf(a){return new Ce(null,function(){return xd(a,nf(a))},null,null)}function of(a,b){return Se(Le,Te(Z,a,b))}
function pf(a,b){return new Ce(null,function(){var c=H(b);if(c){if(Td(c)){for(var d=Fc(c),e=Q(d),f=new Ee(Array(e),0),g=0;;)if(g<e){var k=Rb.b(d,g);k=a.a?a.a(k):a.call(null,k);w(k)&&(k=Rb.b(d,g),f.add(k));g+=1}else break;return He(f.qa(),pf(a,Gc(c)))}d=K(c);c=bd(c);return w(a.a?a.a(d):a.call(null,d))?xd(d,pf(a,c)):pf(a,c)}return null},null,null)}function qf(a,b){return pf(df(a),b)}
var rf=function rf(b){switch(arguments.length){case 0:return rf.m();case 1:return rf.a(arguments[0]);case 2:return rf.b(arguments[0],arguments[1]);case 3:return rf.f(arguments[0],arguments[1],arguments[2]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};rf.m=function(){return Dd};rf.a=function(a){return a};rf.b=function(a,b){return null!=a?null!=a&&(a.s&4||r===a.Rc)?hc(Ac(Hb(zc,yc(a),b)),Kd(a)):Hb(Pb,a,b):Hb(Cd,L,b)};
rf.f=function(a,b,c){return null!=a&&(a.s&4||r===a.Rc)?hc(Ac(ne(b,Me,yc(a),c)),Kd(a)):ne(b,Cd,a,c)};rf.B=3;function sf(a,b){return Hb(G,a,b)}function tf(a,b){this.K=a;this.c=b}function uf(a){return new tf(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function vf(a){a=a.j;return 32>a?0:a-1>>>5<<5}function xf(a,b,c){for(;;){if(0===b)return c;var d=uf(a);d.c[0]=c;c=d;b-=5}}
var yf=function yf(b,c,d,e){var f=new tf(d.K,Fb(d.c)),g=b.j-1>>>c&31;5===c?f.c[g]=e:(d=d.c[g],null!=d?(c-=5,b=yf.w?yf.w(b,c,d,e):yf.call(null,b,c,d,e)):b=xf(null,c-5,e),f.c[g]=b);return f};function zf(a,b){throw Error([C.a("No item "),C.a(a),C.a(" in vector of length "),C.a(b)].join(""));}function Af(a,b){if(b>=vf(a))return a.J;for(var c=a.root,d=a.shift;;)if(0<d){var e=d-5;c=c.c[b>>>d&31];d=e}else return c.c}
var Bf=function Bf(b,c,d,e,f){var g=new tf(d.K,Fb(d.c));if(0===c)g.c[e&31]=f;else{var k=e>>>c&31;c-=5;d=d.c[k];b=Bf.R?Bf.R(b,c,d,e,f):Bf.call(null,b,c,d,e,f);g.c[k]=b}return g};function Cf(a,b,c,d,e,f){this.i=a;this.Zb=b;this.c=c;this.Rd=d;this.start=e;this.end=f}Cf.prototype.aa=function(){return this.i<this.end};Cf.prototype.next=function(){32===this.i-this.Zb&&(this.c=Af(this.Rd,this.i),this.Zb+=32);var a=this.c[this.i&31];this.i+=1;return a};
function Df(a,b,c,d){return c<d?Ef(a,b,qd(a,c),c+1,d):b.m?b.m():b.call(null)}function Ef(a,b,c,d,e){var f=c;c=d;for(d=Af(a,d);;)if(c<e){var g=c&31;d=0===g?Af(a,c):d;g=d[g];f=b.b?b.b(f,g):b.call(null,f,g);if(kd(f))return ec(f);c+=1}else return f}function W(a,b,c,d,e,f){this.o=a;this.j=b;this.shift=c;this.root=d;this.J=e;this.u=f;this.h=167668511;this.s=139268}h=W.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){return"number"===typeof b?this.ua(null,b,c):c};
h.Pb=function(a,b,c){a=0;for(var d=c;;)if(a<this.j){var e=Af(this,a);c=e.length;a:for(var f=0;;)if(f<c){var g=f+a,k=e[f];d=b.f?b.f(d,g,k):b.call(null,d,g,k);if(kd(d)){e=d;break a}f+=1}else{e=d;break a}if(kd(e))return ec(e);a+=c;d=e}else return d};h.L=function(a,b){return(0<=b&&b<this.j?Af(this,b):zf(b,this.j))[b&31]};h.ua=function(a,b,c){return 0<=b&&b<this.j?Af(this,b)[b&31]:c};
h.ed=function(a,b){if(0<=a&&a<this.j){if(vf(this)<=a){var c=Fb(this.J);c[a&31]=b;return new W(this.o,this.j,this.shift,this.root,c,null)}return new W(this.o,this.j,this.shift,Bf(this,this.shift,this.root,a,b),this.J,null)}if(a===this.j)return this.T(null,b);throw Error([C.a("Index "),C.a(a),C.a(" out of bounds  [0,"),C.a(this.j),C.a("]")].join(""));};h.xa=function(){var a=this.j;return new Cf(0,0,0<Q(this)?Af(this,0):null,this,0,a)};h.G=function(){return this.o};h.P=function(){return this.j};
h.Qb=function(){return this.L(null,0)};h.Rb=function(){return this.L(null,1)};h.bc=function(){return 0<this.j?new td(this,this.j-1,null):null};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){if(b instanceof W)if(this.j===Q(b))for(var c=this.xa(null),d=Lc(b);;)if(c.aa()){var e=c.next(),f=d.next();if(!O.b(e,f))return!1}else return!0;else return!1;else return wd(this,b)};
h.tb=function(){var a=this.j,b=this.shift,c=new tf({},Fb(this.root.c)),d=this.J,e=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];Vd(d,0,e,0,d.length);return new Ff(a,b,c,e)};h.X=function(){return hc(Dd,this.o)};h.da=function(a,b){return Df(this,b,0,this.j)};
h.ea=function(a,b,c){a=0;for(var d=c;;)if(a<this.j){var e=Af(this,a);c=e.length;a:for(var f=0;;)if(f<c){var g=e[f];d=b.b?b.b(d,g):b.call(null,d,g);if(kd(d)){e=d;break a}f+=1}else{e=d;break a}if(kd(e))return ec(e);a+=c;d=e}else return d};h.cb=function(a,b,c){if("number"===typeof b)return this.ed(b,c);throw Error("Vector's key for assoc must be a number.");};h.Mb=function(a,b){return"number"!==typeof b||isNaN(b)||Infinity===b||parseFloat(b)!==parseInt(b,10)?!1:0<=b&&b<this.j};
h.M=function(){if(0===this.j)var a=null;else if(32>=this.j)a=new ad(this.J,0,null);else{a:{a=this.root;for(var b=this.shift;;)if(0<b)b-=5,a=a.c[0];else{a=a.c;break a}}a=new Gf(this,a,0,0,null,null)}return a};h.I=function(a,b){return new W(b,this.j,this.shift,this.root,this.J,this.u)};
h.T=function(a,b){if(32>this.j-vf(this)){for(var c=this.J.length,d=Array(c+1),e=0;;)if(e<c)d[e]=this.J[e],e+=1;else break;d[c]=b;return new W(this.o,this.j+1,this.shift,this.root,d,null)}c=(d=this.j>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=uf(null),d.c[0]=this.root,e=xf(null,this.shift,new tf(null,this.J)),d.c[1]=e):d=yf(this,this.shift,this.root,new tf(null,this.J));return new W(this.o,this.j+1,c,d,[b],null)};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return this.L(null,c);case 3:return this.ua(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return this.L(null,c)};a.f=function(a,c,d){return this.ua(null,c,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return this.L(null,a)};h.b=function(a,b){return this.ua(null,a,b)};
var X=new tf(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),Dd=new W(null,0,5,X,[],gd);function Hf(a){var b=a.length;if(32>b)return new W(null,b,5,X,a,null);for(var c=32,d=(new W(null,32,5,X,a.slice(0,32),null)).tb(null);;)if(c<b){var e=c+1;d=Me.b(d,a[c]);c=e}else return Ac(d)}W.prototype[Eb]=function(){return dd(this)};function If(a){return zb(a)?Hf(a):Ac(Hb(zc,yc(Dd),a))}
var Jf=function Jf(b){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Jf.l(0<c.length?new ad(c.slice(0),0,null):null)};Jf.l=function(a){return a instanceof ad&&0===a.i?Hf(a.c):If(a)};Jf.B=0;Jf.F=function(a){return Jf.l(H(a))};function Gf(a,b,c,d,e,f){this.sa=a;this.node=b;this.i=c;this.ba=d;this.o=e;this.u=f;this.h=32375020;this.s=1536}h=Gf.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){if(this.ba+1<this.node.length){var a=new Gf(this.sa,this.node,this.i,this.ba+1,null,null);return null==a?null:a}return this.nc(null)};
h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(Dd,this.o)};h.da=function(a,b){return Df(this.sa,b,this.i+this.ba,Q(this.sa))};h.ea=function(a,b,c){return Ef(this.sa,b,c,this.i+this.ba,Q(this.sa))};h.$=function(){return this.node[this.ba]};h.ka=function(){if(this.ba+1<this.node.length){var a=new Gf(this.sa,this.node,this.i,this.ba+1,null,null);return null==a?L:a}return this.Nb(null)};h.M=function(){return this};
h.$b=function(){var a=this.node;return new Fe(a,this.ba,a.length)};h.Nb=function(){var a=this.i+this.node.length;return a<Lb(this.sa)?new Gf(this.sa,Af(this.sa,a),a,0,null,null):L};h.I=function(a,b){return new Gf(this.sa,this.node,this.i,this.ba,b,null)};h.T=function(a,b){return xd(b,this)};h.nc=function(){var a=this.i+this.node.length;return a<Lb(this.sa)?new Gf(this.sa,Af(this.sa,a),a,0,null,null):null};Gf.prototype[Eb]=function(){return dd(this)};
function Kf(a,b){return a===b.K?b:new tf(a,Fb(b.c))}var Lf=function Lf(b,c,d,e){d=Kf(b.root.K,d);var f=b.j-1>>>c&31;if(5===c)b=e;else{var g=d.c[f];null!=g?(c-=5,b=Lf.w?Lf.w(b,c,g,e):Lf.call(null,b,c,g,e)):b=xf(b.root.K,c-5,e)}d.c[f]=b;return d};function Ff(a,b,c,d){this.j=a;this.shift=b;this.root=c;this.J=d;this.s=88;this.h=275}h=Ff.prototype;
h.ub=function(a,b){if(this.root.K){if(32>this.j-vf(this))this.J[this.j&31]=b;else{var c=new tf(this.root.K,this.J),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.J=d;if(this.j>>>5>1<<this.shift){d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];var e=this.shift+
5;d[0]=this.root;d[1]=xf(this.root.K,this.shift,c);this.root=new tf(this.root.K,d);this.shift=e}else this.root=Lf(this,this.shift,this.root,c)}this.j+=1;return this}throw Error("conj! after persistent!");};h.Cb=function(){if(this.root.K){this.root.K=null;var a=this.j-vf(this),b=Array(a);Vd(this.J,0,b,0,a);return new W(null,this.j,this.shift,this.root,b,null)}throw Error("persistent! called twice");};
h.lb=function(a,b,c){if("number"===typeof b)return Mf(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
function Mf(a,b,c){if(a.root.K){if(0<=b&&b<a.j){if(vf(a)<=b)a.J[b&31]=c;else{var d=function(){return function(){return function f(d,k){var g=Kf(a.root.K,k);if(0===d)g.c[b&31]=c;else{var m=b>>>d&31,n=f(d-5,g.c[m]);g.c[m]=n}return g}}(a)(a.shift,a.root)}();a.root=d}return a}if(b===a.j)return a.ub(null,c);throw Error([C.a("Index "),C.a(b),C.a(" out of bounds for TransientVector of length"),C.a(a.j)].join(""));}throw Error("assoc! after persistent!");}
h.P=function(){if(this.root.K)return this.j;throw Error("count after persistent!");};h.L=function(a,b){if(this.root.K)return(0<=b&&b<this.j?Af(this,b):zf(b,this.j))[b&31];throw Error("nth after persistent!");};h.ua=function(a,b,c){return 0<=b&&b<this.j?this.L(null,b):c};h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){return"number"===typeof b?this.ua(null,b,c):c};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return this.S(null,c);case 3:return this.H(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return this.S(null,c)};a.f=function(a,c,d){return this.H(null,c,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return this.S(null,a)};h.b=function(a,b){return this.H(null,a,b)};function Nf(){this.h=2097152;this.s=0}
Nf.prototype.equiv=function(a){return this.v(null,a)};Nf.prototype.v=function(){return!1};var Of=new Nf;function Pf(a,b){return $d(Qd(b)&&!Rd(b)?Q(a)===Q(b)?(null!=a?a.h&1048576||r===a.$d||(a.h?0:A(kc,a)):A(kc,a))?le(function(a,d,e){return O.b(G.f(b,d,Of),e)?!0:new jd(!1)},a):bf(function(a){return O.b(G.f(b,K(a),Of),Ad(a))},a):null:null)}function Qf(a){this.A=a}
Qf.prototype.next=function(){if(null!=this.A){var a=K(this.A),b=T(a,0);a=T(a,1);this.A=M(this.A);return{value:[b,a],done:!1}}return{value:null,done:!0}};function Rf(a){this.A=a}Rf.prototype.next=function(){if(null!=this.A){var a=K(this.A);this.A=M(this.A);return{value:[a,a],done:!1}}return{value:null,done:!0}};
function Sf(a,b){if(b instanceof V)a:{var c=a.length;for(var d=b.Fa,e=0;;){if(c<=e){c=-1;break a}if(a[e]instanceof V&&d===a[e].Fa){c=e;break a}e+=2}}else if(ba(b)||"number"===typeof b)a:for(c=a.length,d=0;;){if(c<=d){c=-1;break a}if(b===a[d]){c=d;break a}d+=2}else if(b instanceof F)a:for(c=a.length,d=b.Ia,e=0;;){if(c<=e){c=-1;break a}if(a[e]instanceof F&&d===a[e].Ia){c=e;break a}e+=2}else if(null==b)a:for(c=a.length,d=0;;){if(c<=d){c=-1;break a}if(null==a[d]){c=d;break a}d+=2}else a:for(c=a.length,
d=0;;){if(c<=d){c=-1;break a}if(O.b(b,a[d])){c=d;break a}d+=2}return c}function Tf(a,b,c){this.c=a;this.i=b;this.ja=c;this.h=32374990;this.s=0}h=Tf.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.ja};h.Y=function(){return this.i<this.c.length-2?new Tf(this.c,this.i+2,this.ja):null};h.P=function(){return(this.c.length-this.i)/2};h.N=function(){return fd(this)};
h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.ja)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return new W(null,2,5,X,[this.c[this.i],this.c[this.i+1]],null)};h.ka=function(){return this.i<this.c.length-2?new Tf(this.c,this.i+2,this.ja):L};h.M=function(){return this};h.I=function(a,b){return new Tf(this.c,this.i,b)};h.T=function(a,b){return xd(b,this)};Tf.prototype[Eb]=function(){return dd(this)};
function Uf(a,b,c){this.c=a;this.i=b;this.j=c}Uf.prototype.aa=function(){return this.i<this.j};Uf.prototype.next=function(){var a=new W(null,2,5,X,[this.c[this.i],this.c[this.i+1]],null);this.i+=2;return a};function v(a,b,c,d){this.o=a;this.j=b;this.c=c;this.u=d;this.h=16647951;this.s=139268}h=v.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.keys=function(){return dd(Vf(this))};h.entries=function(){return new Qf(H(H(this)))};h.values=function(){return dd(Wf(this))};
h.has=function(a){return ae(this,a)};h.get=function(a,b){return this.H(null,a,b)};h.forEach=function(a){for(var b,c,d=H(this),e=null,f=0,g=0;;)if(g<f)b=e.L(null,g),c=T(b,0),b=T(b,1),a.b?a.b(b,c):a.call(null,b,c),g+=1;else if(c=H(d))d=c,Td(d)?(e=Fc(d),d=Gc(d),c=e,b=Q(e),e=c,f=b):(e=K(d),c=T(e,0),b=T(e,1),a.b?a.b(b,c):a.call(null,b,c),d=M(d),e=null,f=0),g=0;else return null};h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){a=Sf(this.c,b);return-1===a?c:this.c[a+1]};
h.Pb=function(a,b,c){a=this.c.length;for(var d=0;;)if(d<a){var e=this.c[d],f=this.c[d+1];c=b.f?b.f(c,e,f):b.call(null,c,e,f);if(kd(c))return ec(c);d+=2}else return c};h.xa=function(){return new Uf(this.c,0,2*this.j)};h.G=function(){return this.o};h.P=function(){return this.j};h.N=function(){var a=this.u;return null!=a?a:this.u=a=hd(this)};
h.v=function(a,b){if(Qd(b)&&!Rd(b)){var c=this.c.length;if(this.j===b.P(null))for(var d=0;;)if(d<c){var e=b.H(null,this.c[d],Wd);if(e!==Wd)if(O.b(this.c[d+1],e))d+=2;else return!1;else return!1}else return!0;else return!1}else return!1};h.tb=function(){return new Xf({},this.c.length,Fb(this.c))};h.X=function(){return hc($e,this.o)};h.da=function(a,b){return ie(this,b)};h.ea=function(a,b,c){return je(this,b,c)};
h.cb=function(a,b,c){a=Sf(this.c,b);if(-1===a){if(this.j<Yf){a=this.c;for(var d=a.length,e=Array(d+2),f=0;;)if(f<d)e[f]=a[f],f+=1;else break;e[d]=b;e[d+1]=c;return new v(this.o,this.j+1,e,null)}return hc(Yb(rf.b(Zf,this),b,c),this.o)}if(c===this.c[a+1])return this;b=Fb(this.c);b[a+1]=c;return new v(this.o,this.j,b,null)};h.Mb=function(a,b){return-1!==Sf(this.c,b)};h.M=function(){var a=this.c;return 0<=a.length-2?new Tf(a,0,null):null};h.I=function(a,b){return new v(b,this.j,this.c,this.u)};
h.T=function(a,b){if(Sd(b))return this.cb(null,Rb.b(b,0),Rb.b(b,1));for(var c=this,d=H(b);;){if(null==d)return c;var e=K(d);if(Sd(e))c=c.cb(null,Rb.b(e,0),Rb.b(e,1)),d=M(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return this.S(null,c);case 3:return this.H(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return this.S(null,c)};a.f=function(a,c,d){return this.H(null,c,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return this.S(null,a)};h.b=function(a,b){return this.H(null,a,b)};var $e=new v(null,0,[],id),Yf=8;
function Hd(a){for(var b=[],c=0;;)if(c<a.length){var d=a[c],e=a[c+1],f=Sf(b,d);-1===f?(f=b,f.push(d),f.push(e)):b[f+1]=e;c+=2}else break;return new v(null,b.length/2,b,null)}v.prototype[Eb]=function(){return dd(this)};function Xf(a,b,c){this.vb=a;this.xb=b;this.c=c;this.h=258;this.s=56}h=Xf.prototype;h.P=function(){if(w(this.vb))return pe(this.xb);throw Error("count after persistent!");};h.S=function(a,b){return this.H(null,b,null)};
h.H=function(a,b,c){if(w(this.vb))return a=Sf(this.c,b),-1===a?c:this.c[a+1];throw Error("lookup after persistent!");};h.ub=function(a,b){if(w(this.vb)){if(null!=b?b.h&2048||r===b.pc||(b.h?0:A($b,b)):A($b,b))return this.lb(null,ac(b),bc(b));for(var c=H(b),d=this;;){var e=K(c);if(w(e))c=M(c),d=d.lb(null,ac(e),bc(e));else return d}}else throw Error("conj! after persistent!");};
h.Cb=function(){if(w(this.vb))return this.vb=!1,new v(null,pe(this.xb),this.c,null);throw Error("persistent! called twice");};h.lb=function(a,b,c){if(w(this.vb)){a=Sf(this.c,b);if(-1===a){if(this.xb+2<=2*Yf)return this.xb+=2,this.c.push(b),this.c.push(c),this;a:{a=this.xb;var d=this.c;var e=yc(Zf);for(var f=0;;)if(f<a)e=Bc(e,d[f],d[f+1]),f+=2;else break a}return Bc(e,b,c)}c!==this.c[a+1]&&(this.c[a+1]=c);return this}throw Error("assoc! after persistent!");};function $f(){this.ca=!1}
function ag(a,b){return a===b?!0:xe(a,b)?!0:O.b(a,b)}function bg(a,b,c){a=Fb(a);a[b]=c;return a}function cg(a,b,c,d){a=a.nb(b);a.c[c]=d;return a}function dg(a,b,c){for(var d=a.length,e=0,f=c;;)if(e<d){c=a[e];if(null!=c){var g=a[e+1];c=b.f?b.f(f,c,g):b.call(null,f,c,g)}else c=a[e+1],c=null!=c?c.Gb(b,f):f;if(kd(c))return c;e+=2;f=c}else return f}function eg(a,b,c,d){this.c=a;this.i=b;this.Hb=c;this.Ba=d}
eg.prototype.advance=function(){for(var a=this.c.length;;)if(this.i<a){var b=this.c[this.i],c=this.c[this.i+1];null!=b?b=this.Hb=new W(null,2,5,X,[b,c],null):null!=c?(b=Lc(c),b=b.aa()?this.Ba=b:!1):b=!1;this.i+=2;if(b)return!0}else return!1};eg.prototype.aa=function(){var a=null!=this.Hb;return a?a:(a=null!=this.Ba)?a:this.advance()};
eg.prototype.next=function(){if(null!=this.Hb){var a=this.Hb;this.Hb=null;return a}if(null!=this.Ba)return a=this.Ba.next(),this.Ba.aa()||(this.Ba=null),a;if(this.advance())return this.next();throw Error("No such element");};eg.prototype.remove=function(){return Error("Unsupported operation")};function fg(a,b,c){this.K=a;this.U=b;this.c=c;this.s=131072;this.h=0}h=fg.prototype;
h.nb=function(a){if(a===this.K)return this;var b=qe(this.U),c=Array(0>b?4:2*(b+1));Vd(this.c,0,c,0,2*b);return new fg(a,this.U,c)};h.Fb=function(){return gg(this.c,0,null)};h.Gb=function(a,b){return dg(this.c,a,b)};h.jb=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.U&e))return d;var f=qe(this.U&e-1);e=this.c[2*f];f=this.c[2*f+1];return null==e?f.jb(a+5,b,c,d):ag(c,e)?f:d};
h.Aa=function(a,b,c,d,e,f){var g=1<<(c>>>b&31),k=qe(this.U&g-1);if(0===(this.U&g)){var l=qe(this.U);if(2*l<this.c.length){a=this.nb(a);b=a.c;f.ca=!0;a:for(c=2*(l-k),f=2*k+(c-1),l=2*(k+1)+(c-1);;){if(0===c)break a;b[l]=b[f];--l;--c;--f}b[2*k]=d;b[2*k+1]=e;a.U|=g;return a}if(16<=l){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=hg.Aa(a,b+5,c,d,e,f);for(e=d=0;;)if(32>d)0!==
(this.U>>>d&1)&&(k[d]=null!=this.c[e]?hg.Aa(a,b+5,Wc(this.c[e]),this.c[e],this.c[e+1],f):this.c[e+1],e+=2),d+=1;else break;return new ig(a,l+1,k)}b=Array(2*(l+4));Vd(this.c,0,b,0,2*k);b[2*k]=d;b[2*k+1]=e;Vd(this.c,2*k,b,2*(k+1),2*(l-k));f.ca=!0;a=this.nb(a);a.c=b;a.U|=g;return a}l=this.c[2*k];g=this.c[2*k+1];if(null==l)return l=g.Aa(a,b+5,c,d,e,f),l===g?this:cg(this,a,2*k+1,l);if(ag(d,l))return e===g?this:cg(this,a,2*k+1,e);f.ca=!0;f=b+5;b=Wc(l);if(b===c)e=new jg(null,b,2,[l,g,d,e]);else{var m=new $f;
e=hg.Aa(a,f,b,l,g,m).Aa(a,f,c,d,e,m)}d=2*k;k=2*k+1;a=this.nb(a);a.c[d]=null;a.c[k]=e;return a};
h.za=function(a,b,c,d,e){var f=1<<(b>>>a&31),g=qe(this.U&f-1);if(0===(this.U&f)){var k=qe(this.U);if(16<=k){g=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];g[b>>>a&31]=hg.za(a+5,b,c,d,e);for(d=c=0;;)if(32>c)0!==(this.U>>>c&1)&&(g[c]=null!=this.c[d]?hg.za(a+5,Wc(this.c[d]),this.c[d],this.c[d+1],e):this.c[d+1],d+=2),c+=1;else break;return new ig(null,k+1,g)}a=Array(2*(k+1));Vd(this.c,
0,a,0,2*g);a[2*g]=c;a[2*g+1]=d;Vd(this.c,2*g,a,2*(g+1),2*(k-g));e.ca=!0;return new fg(null,this.U|f,a)}var l=this.c[2*g];f=this.c[2*g+1];if(null==l)return k=f.za(a+5,b,c,d,e),k===f?this:new fg(null,this.U,bg(this.c,2*g+1,k));if(ag(c,l))return d===f?this:new fg(null,this.U,bg(this.c,2*g+1,d));e.ca=!0;e=this.U;k=this.c;a+=5;var m=Wc(l);if(m===b)c=new jg(null,m,2,[l,f,c,d]);else{var n=new $f;c=hg.za(a,m,l,f,n).za(a,b,c,d,n)}a=2*g;g=2*g+1;d=Fb(k);d[a]=null;d[g]=c;return new fg(null,e,d)};
h.xa=function(){return new eg(this.c,0,null,null)};var hg=new fg(null,0,[]);function kg(a,b,c){this.c=a;this.i=b;this.Ba=c}kg.prototype.aa=function(){for(var a=this.c.length;;){if(null!=this.Ba&&this.Ba.aa())return!0;if(this.i<a){var b=this.c[this.i];this.i+=1;null!=b&&(this.Ba=Lc(b))}else return!1}};kg.prototype.next=function(){if(this.aa())return this.Ba.next();throw Error("No such element");};kg.prototype.remove=function(){return Error("Unsupported operation")};
function ig(a,b,c){this.K=a;this.j=b;this.c=c;this.s=131072;this.h=0}h=ig.prototype;h.nb=function(a){return a===this.K?this:new ig(a,this.j,Fb(this.c))};h.Fb=function(){return lg(this.c,0,null)};h.Gb=function(a,b){for(var c=this.c.length,d=0,e=b;;)if(d<c){var f=this.c[d];if(null!=f&&(e=f.Gb(a,e),kd(e)))return e;d+=1}else return e};h.jb=function(a,b,c,d){var e=this.c[b>>>a&31];return null!=e?e.jb(a+5,b,c,d):d};
h.Aa=function(a,b,c,d,e,f){var g=c>>>b&31,k=this.c[g];if(null==k)return a=cg(this,a,g,hg.Aa(a,b+5,c,d,e,f)),a.j+=1,a;b=k.Aa(a,b+5,c,d,e,f);return b===k?this:cg(this,a,g,b)};h.za=function(a,b,c,d,e){var f=b>>>a&31,g=this.c[f];if(null==g)return new ig(null,this.j+1,bg(this.c,f,hg.za(a+5,b,c,d,e)));a=g.za(a+5,b,c,d,e);return a===g?this:new ig(null,this.j,bg(this.c,f,a))};h.xa=function(){return new kg(this.c,0,null)};
function mg(a,b,c){b*=2;for(var d=0;;)if(d<b){if(ag(c,a[d]))return d;d+=2}else return-1}function jg(a,b,c,d){this.K=a;this.hb=b;this.j=c;this.c=d;this.s=131072;this.h=0}h=jg.prototype;h.nb=function(a){if(a===this.K)return this;var b=Array(2*(this.j+1));Vd(this.c,0,b,0,2*this.j);return new jg(a,this.hb,this.j,b)};h.Fb=function(){return gg(this.c,0,null)};h.Gb=function(a,b){return dg(this.c,a,b)};h.jb=function(a,b,c,d){a=mg(this.c,this.j,c);return 0>a?d:ag(c,this.c[a])?this.c[a+1]:d};
h.Aa=function(a,b,c,d,e,f){if(c===this.hb){b=mg(this.c,this.j,d);if(-1===b){if(this.c.length>2*this.j)return b=2*this.j,c=2*this.j+1,a=this.nb(a),a.c[b]=d,a.c[c]=e,f.ca=!0,a.j+=1,a;c=this.c.length;b=Array(c+2);Vd(this.c,0,b,0,c);b[c]=d;b[c+1]=e;f.ca=!0;d=this.j+1;a===this.K?(this.c=b,this.j=d,a=this):a=new jg(this.K,this.hb,d,b);return a}return this.c[b+1]===e?this:cg(this,a,b+1,e)}return(new fg(a,1<<(this.hb>>>b&31),[null,this,null,null])).Aa(a,b,c,d,e,f)};
h.za=function(a,b,c,d,e){return b===this.hb?(a=mg(this.c,this.j,c),-1===a?(a=2*this.j,b=Array(a+2),Vd(this.c,0,b,0,a),b[a]=c,b[a+1]=d,e.ca=!0,new jg(null,this.hb,this.j+1,b)):O.b(this.c[a+1],d)?this:new jg(null,this.hb,this.j,bg(this.c,a+1,d))):(new fg(null,1<<(this.hb>>>a&31),[null,this])).za(a,b,c,d,e)};h.xa=function(){return new eg(this.c,0,null,null)};function ng(a,b,c,d,e){this.o=a;this.Ca=b;this.i=c;this.A=d;this.u=e;this.h=32374988;this.s=0}h=ng.prototype;h.toString=function(){return Nc(this)};
h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return null==this.A?gg(this.Ca,this.i+2,null):gg(this.Ca,this.i,M(this.A))};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};
h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.o)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return null==this.A?new W(null,2,5,X,[this.Ca[this.i],this.Ca[this.i+1]],null):K(this.A)};h.ka=function(){var a=null==this.A?gg(this.Ca,this.i+2,null):gg(this.Ca,this.i,M(this.A));return null!=a?a:L};h.M=function(){return this};h.I=function(a,b){return new ng(b,this.Ca,this.i,this.A,this.u)};h.T=function(a,b){return xd(b,this)};
ng.prototype[Eb]=function(){return dd(this)};function gg(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new ng(null,a,b,null,null);var d=a[b+1];if(w(d)&&(d=d.Fb(),w(d)))return new ng(null,a,b+2,d,null);b+=2}else return null;else return new ng(null,a,b,c,null)}function og(a,b,c,d,e){this.o=a;this.Ca=b;this.i=c;this.A=d;this.u=e;this.h=32374988;this.s=0}h=og.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.o};h.Y=function(){return lg(this.Ca,this.i,M(this.A))};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.o)};
h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return K(this.A)};h.ka=function(){var a=lg(this.Ca,this.i,M(this.A));return null!=a?a:L};h.M=function(){return this};h.I=function(a,b){return new og(b,this.Ca,this.i,this.A,this.u)};h.T=function(a,b){return xd(b,this)};og.prototype[Eb]=function(){return dd(this)};
function lg(a,b,c){if(null==c)for(c=a.length;;)if(b<c){var d=a[b];if(w(d)&&(d=d.Fb(),w(d)))return new og(null,a,b+1,d,null);b+=1}else return null;else return new og(null,a,b,c,null)}function pg(a,b,c){this.ha=a;this.Lc=b;this.gc=c}pg.prototype.aa=function(){return!this.gc||this.Lc.aa()};pg.prototype.next=function(){if(this.gc)return this.Lc.next();this.gc=!0;return new W(null,2,5,X,[null,this.ha],null)};pg.prototype.remove=function(){return Error("Unsupported operation")};
function qg(a,b,c,d,e,f){this.o=a;this.j=b;this.root=c;this.la=d;this.ha=e;this.u=f;this.h=16123663;this.s=139268}h=qg.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.keys=function(){return dd(Vf(this))};h.entries=function(){return new Qf(H(H(this)))};h.values=function(){return dd(Wf(this))};h.has=function(a){return ae(this,a)};h.get=function(a,b){return this.H(null,a,b)};
h.forEach=function(a){for(var b,c,d=H(this),e=null,f=0,g=0;;)if(g<f)b=e.L(null,g),c=T(b,0),b=T(b,1),a.b?a.b(b,c):a.call(null,b,c),g+=1;else if(c=H(d))d=c,Td(d)?(e=Fc(d),d=Gc(d),c=e,b=Q(e),e=c,f=b):(e=K(d),c=T(e,0),b=T(e,1),a.b?a.b(b,c):a.call(null,b,c),d=M(d),e=null,f=0),g=0;else return null};h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){return null==b?this.la?this.ha:c:null==this.root?c:this.root.jb(0,Wc(b),b,c)};
h.Pb=function(a,b,c){a=this.la?b.f?b.f(c,null,this.ha):b.call(null,c,null,this.ha):c;kd(a)?b=ec(a):null!=this.root?(b=this.root.Gb(b,a),b=kd(b)?ec(b):b):b=a;return b};h.xa=function(){var a=this.root?Lc(this.root):Ye();return this.la?new pg(this.ha,a,!1):a};h.G=function(){return this.o};h.P=function(){return this.j};h.N=function(){var a=this.u;return null!=a?a:this.u=a=hd(this)};h.v=function(a,b){return Pf(this,b)};h.tb=function(){return new rg({},this.root,this.j,this.la,this.ha)};
h.X=function(){return hc(Zf,this.o)};h.cb=function(a,b,c){if(null==b)return this.la&&c===this.ha?this:new qg(this.o,this.la?this.j:this.j+1,this.root,!0,c,null);a=new $f;b=(null==this.root?hg:this.root).za(0,Wc(b),b,c,a);return b===this.root?this:new qg(this.o,a.ca?this.j+1:this.j,b,this.la,this.ha,null)};h.Mb=function(a,b){return null==b?this.la:null==this.root?!1:this.root.jb(0,Wc(b),b,Wd)!==Wd};
h.M=function(){if(0<this.j){var a=null!=this.root?this.root.Fb():null;return this.la?xd(new W(null,2,5,X,[null,this.ha],null),a):a}return null};h.I=function(a,b){return new qg(b,this.j,this.root,this.la,this.ha,this.u)};h.T=function(a,b){if(Sd(b))return this.cb(null,Rb.b(b,0),Rb.b(b,1));for(var c=this,d=H(b);;){if(null==d)return c;var e=K(d);if(Sd(e))c=c.cb(null,Rb.b(e,0),Rb.b(e,1)),d=M(d);else throw Error("conj on a map takes map entries or seqables of map entries");}};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return this.S(null,c);case 3:return this.H(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return this.S(null,c)};a.f=function(a,c,d){return this.H(null,c,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return this.S(null,a)};h.b=function(a,b){return this.H(null,a,b)};var Zf=new qg(null,0,null,!1,null,id);
function sg(a,b){for(var c=a.length,d=0,e=yc(Zf);;)if(d<c){var f=d+1;e=e.lb(null,a[d],b[d]);d=f}else return Ac(e)}qg.prototype[Eb]=function(){return dd(this)};function rg(a,b,c,d,e){this.K=a;this.root=b;this.count=c;this.la=d;this.ha=e;this.h=258;this.s=56}function tg(a,b,c){if(a.K){if(null==b)a.ha!==c&&(a.ha=c),a.la||(a.count+=1,a.la=!0);else{var d=new $f;b=(null==a.root?hg:a.root).Aa(a.K,0,Wc(b),b,c,d);b!==a.root&&(a.root=b);d.ca&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}
h=rg.prototype;h.P=function(){if(this.K)return this.count;throw Error("count after persistent!");};h.S=function(a,b){return null==b?this.la?this.ha:null:null==this.root?null:this.root.jb(0,Wc(b),b)};h.H=function(a,b,c){return null==b?this.la?this.ha:c:null==this.root?c:this.root.jb(0,Wc(b),b,c)};
h.ub=function(a,b){a:if(this.K)if(null!=b?b.h&2048||r===b.pc||(b.h?0:A($b,b)):A($b,b))var c=tg(this,ac(b),bc(b));else{c=H(b);for(var d=this;;){var e=K(c);if(w(e))c=M(c),d=tg(d,ac(e),bc(e));else{c=d;break a}}}else throw Error("conj! after persistent");return c};h.Cb=function(){if(this.K){this.K=null;var a=new qg(null,this.count,this.root,this.la,this.ha,null)}else throw Error("persistent! called twice");return a};h.lb=function(a,b,c){return tg(this,b,c)};
var ug=function ug(b){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return ug.l(0<c.length?new ad(c.slice(0),0,null):null)};ug.l=function(a){for(var b=H(a),c=yc(Zf);;)if(b){a=M(M(b));var d=K(b);b=Ad(b);c=Bc(c,d,b);b=a}else return Ac(c)};ug.B=0;ug.F=function(a){return ug.l(H(a))};var vg=function vg(b){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return vg.l(0<c.length?new ad(c.slice(0),0,null):null)};
vg.l=function(a){a=a instanceof ad&&0===a.i?a.c:Gb(a);return Hd(a)};vg.B=0;vg.F=function(a){return vg.l(H(a))};function wg(a,b){this.C=a;this.ja=b;this.h=32374988;this.s=0}h=wg.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};
h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.ja};h.Y=function(){var a=(null!=this.C?this.C.h&128||r===this.C.Sb||(this.C.h?0:A(Ub,this.C)):A(Ub,this.C))?this.C.Y(null):M(this.C);return null==a?null:new wg(a,this.ja)};h.N=function(){return fd(this)};
h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.ja)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return this.C.$(null).Qb(null)};h.ka=function(){var a=(null!=this.C?this.C.h&128||r===this.C.Sb||(this.C.h?0:A(Ub,this.C)):A(Ub,this.C))?this.C.Y(null):M(this.C);return null!=a?new wg(a,this.ja):L};h.M=function(){return this};h.I=function(a,b){return new wg(this.C,b)};h.T=function(a,b){return xd(b,this)};wg.prototype[Eb]=function(){return dd(this)};
function Vf(a){return(a=H(a))?new wg(a,null):null}function xg(a,b){this.C=a;this.ja=b;this.h=32374988;this.s=0}h=xg.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.G=function(){return this.ja};h.Y=function(){var a=(null!=this.C?this.C.h&128||r===this.C.Sb||(this.C.h?0:A(Ub,this.C)):A(Ub,this.C))?this.C.Y(null):M(this.C);return null==a?null:new xg(a,this.ja)};h.N=function(){return fd(this)};
h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.ja)};h.da=function(a,b){return yd(b,this)};h.ea=function(a,b,c){return zd(b,c,this)};h.$=function(){return this.C.$(null).Rb(null)};h.ka=function(){var a=(null!=this.C?this.C.h&128||r===this.C.Sb||(this.C.h?0:A(Ub,this.C)):A(Ub,this.C))?this.C.Y(null):M(this.C);return null!=a?new xg(a,this.ja):L};h.M=function(){return this};h.I=function(a,b){return new xg(this.C,b)};h.T=function(a,b){return xd(b,this)};xg.prototype[Eb]=function(){return dd(this)};
function Wf(a){return(a=H(a))?new xg(a,null):null}var yg=function yg(b){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return yg.l(0<c.length?new ad(c.slice(0),0,null):null)};yg.l=function(a){return w(cf(me,a))?ke(function(a,c){return Cd.b(w(a)?a:$e,c)},a):null};yg.B=0;yg.F=function(a){return yg.l(H(a))};function zg(a){this.fc=a}zg.prototype.aa=function(){return this.fc.aa()};
zg.prototype.next=function(){if(this.fc.aa())return this.fc.next().J[0];throw Error("No such element");};zg.prototype.remove=function(){return Error("Unsupported operation")};function Ag(a,b,c){this.o=a;this.ib=b;this.u=c;this.h=15077647;this.s=139268}h=Ag.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.keys=function(){return dd(H(this))};h.entries=function(){return new Rf(H(H(this)))};h.values=function(){return dd(H(this))};
h.has=function(a){return ae(this,a)};h.forEach=function(a){for(var b,c,d=H(this),e=null,f=0,g=0;;)if(g<f)b=e.L(null,g),c=T(b,0),b=T(b,1),a.b?a.b(b,c):a.call(null,b,c),g+=1;else if(c=H(d))d=c,Td(d)?(e=Fc(d),d=Gc(d),c=e,b=Q(e),e=c,f=b):(e=K(d),c=T(e,0),b=T(e,1),a.b?a.b(b,c):a.call(null,b,c),d=M(d),e=null,f=0),g=0;else return null};h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){return Xb(this.ib,b)?b:c};h.xa=function(){return new zg(Lc(this.ib))};h.G=function(){return this.o};
h.P=function(){return Lb(this.ib)};h.N=function(){var a=this.u;return null!=a?a:this.u=a=hd(this)};h.v=function(a,b){return Nd(b)&&Q(this)===Q(b)&&le(function(){return function(a,d){var c=ae(b,d);return c?c:new jd(!1)}}(this),this.ib)};h.tb=function(){return new Bg(yc(this.ib))};h.X=function(){return hc(ce,this.o)};h.M=function(){return Vf(this.ib)};h.I=function(a,b){return new Ag(b,this.ib,this.u)};h.T=function(a,b){return new Ag(this.o,Gd.f(this.ib,b,null),null)};
h.call=function(){var a=null;a=function(a,c,d){switch(arguments.length){case 2:return this.S(null,c);case 3:return this.H(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.b=function(a,c){return this.S(null,c)};a.f=function(a,c,d){return this.H(null,c,d)};return a}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return this.S(null,a)};h.b=function(a,b){return this.H(null,a,b)};var ce=new Ag(null,$e,id);Ag.prototype[Eb]=function(){return dd(this)};
function Bg(a){this.bb=a;this.s=136;this.h=259}h=Bg.prototype;h.ub=function(a,b){this.bb=Bc(this.bb,b,null);return this};h.Cb=function(){return new Ag(null,Ac(this.bb),null)};h.P=function(){return Q(this.bb)};h.S=function(a,b){return this.H(null,b,null)};h.H=function(a,b,c){return Wb.f(this.bb,b,Wd)===Wd?c:b};
h.call=function(){function a(a,b,c){return Wb.f(this.bb,b,Wd)===Wd?c:b}function b(a,b){return Wb.f(this.bb,b,Wd)===Wd?null:b}var c=null;c=function(c,e,f){switch(arguments.length){case 2:return b.call(this,0,e);case 3:return a.call(this,0,e,f)}throw Error("Invalid arity: "+(arguments.length-1));};c.b=b;c.f=a;return c}();h.apply=function(a,b){return this.call.apply(this,[this].concat(Fb(b)))};h.a=function(a){return Wb.f(this.bb,a,Wd)===Wd?null:a};h.b=function(a,b){return Wb.f(this.bb,a,Wd)===Wd?b:a};
function Be(a){if(null!=a&&(a.s&4096||r===a.Xc))return a.name;if("string"===typeof a)return a;throw Error([C.a("Doesn't support name: "),C.a(a)].join(""));}function Cg(a,b){for(var c=yc($e),d=H(a),e=H(b);;)if(d&&e){var f=K(d),g=K(e);c=Bc(c,f,g);d=M(d);e=M(e)}else return Ac(c)}function Dg(a,b,c){this.i=a;this.end=b;this.step=c}Dg.prototype.aa=function(){return 0<this.step?this.i<this.end:this.i>this.end};Dg.prototype.next=function(){var a=this.i;this.i+=this.step;return a};
function Eg(a,b,c,d,e){this.o=a;this.start=b;this.end=c;this.step=d;this.u=e;this.h=32375006;this.s=139264}h=Eg.prototype;h.toString=function(){return Nc(this)};h.equiv=function(a){return this.v(null,a)};h.indexOf=function(){var a=null;a=function(a,c){switch(arguments.length){case 1:return P(this,a,0);case 2:return P(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};a.a=function(a){return P(this,a,0)};a.b=function(a,c){return P(this,a,c)};return a}();
h.lastIndexOf=function(){function a(a){return rd(this,a,Q(this))}var b=null;b=function(b,d){switch(arguments.length){case 1:return a.call(this,b);case 2:return rd(this,b,d)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=a;b.b=function(a,b){return rd(this,a,b)};return b}();h.L=function(a,b){if(0<=b&&b<this.P(null))return this.start+b*this.step;if(0<=b&&this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};
h.ua=function(a,b,c){return 0<=b&&b<this.P(null)?this.start+b*this.step:0<=b&&this.start>this.end&&0===this.step?this.start:c};h.xa=function(){return new Dg(this.start,this.end,this.step)};h.G=function(){return this.o};h.Y=function(){return 0<this.step?this.start+this.step<this.end?new Eg(this.o,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new Eg(this.o,this.start+this.step,this.end,this.step,null):null};
h.P=function(){return Ab(this.M(null))?0:Math.ceil((this.end-this.start)/this.step)};h.N=function(){var a=this.u;return null!=a?a:this.u=a=fd(this)};h.v=function(a,b){return wd(this,b)};h.X=function(){return hc(L,this.o)};h.da=function(a,b){a:{var c=Lb(this);if(0===c)c=b.m?b.m():b.call(null);else for(var d=Rb.b(this,0),e=1;;)if(e<c){var f=Rb.b(this,e);d=b.b?b.b(d,f):b.call(null,d,f);if(kd(d)){c=ec(d);break a}e+=1}else{c=d;break a}}return c};
h.ea=function(a,b,c){for(a=this.start;;)if(0<this.step?a<this.end:a>this.end){c=b.b?b.b(c,a):b.call(null,c,a);if(kd(c))return ec(c);a+=this.step}else return c};h.$=function(){return null==this.M(null)?null:this.start};h.ka=function(){return null!=this.M(null)?new Eg(this.o,this.start+this.step,this.end,this.step,null):L};h.M=function(){return 0<this.step?this.start<this.end?this:null:0>this.step?this.start>this.end?this:null:this.start===this.end?null:this};
h.I=function(a,b){return new Eg(b,this.start,this.end,this.step,this.u)};h.T=function(a,b){return xd(b,this)};Eg.prototype[Eb]=function(){return dd(this)};function Fg(a){a:for(var b=a;;)if(H(b))b=M(b);else break a;return a}function Gg(a,b){if("string"===typeof b){var c=a.exec(b);return O.b(K(c),b)?1===Q(c)?K(c):If(c):null}throw new TypeError("re-matches must match against a string.");}
function Hg(a,b,c,d,e,f,g){var k=rb;rb=null==rb?null:rb-1;try{if(null!=rb&&0>rb)return wc(a,"#");wc(a,c);if(0===yb.a(f))H(g)&&wc(a,function(){var a=Ig.a(f);return w(a)?a:"..."}());else{if(H(g)){var l=K(g);b.f?b.f(l,a,f):b.call(null,l,a,f)}for(var m=M(g),n=yb.a(f)-1;;)if(!m||null!=n&&0===n){H(m)&&0===n&&(wc(a,d),wc(a,function(){var a=Ig.a(f);return w(a)?a:"..."}()));break}else{wc(a,d);var p=K(m);c=a;g=f;b.f?b.f(p,c,g):b.call(null,p,c,g);var u=M(m);c=n-1;m=u;n=c}}return wc(a,e)}finally{rb=k}}
function Jg(a,b){for(var c,d=H(b),e=null,f=0,g=0;;)if(g<f)c=e.L(null,g),wc(a,c),g+=1;else if(d=H(d))e=d,Td(e)?(d=Fc(e),e=Gc(e),c=d,f=Q(d),d=e,e=c):(c=K(e),wc(a,c),d=M(e),e=null,f=0),g=0;else return null}function Kg(a){if(null==ob)throw Error("No *print-fn* fn set for evaluation environment");ob.a?ob.a(a):ob.call(null,a);return null}var Lg={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};
function Mg(a){return[C.a('"'),C.a(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return Lg[a]})),C.a('"')].join("")}function Ng(a,b){var c=$d(G.b(a,wb));return c?(c=null!=b?b.h&131072||r===b.ac?!0:!1:!1)?null!=Kd(b):c:c}
function Og(a,b,c){if(null==a)return wc(b,"nil");Ng(c,a)&&(wc(b,"^"),Pg(Kd(a),b,c),wc(b," "));if(a.va)return a.ya(a,b,c);if(null!=a&&(a.h&2147483648||r===a.V))return a.O(null,b,c);if(!0===a||!1===a||"number"===typeof a)return wc(b,""+C.a(a));if(null!=a&&a.constructor===Object)return wc(b,"#js "),Qg(Z.b(function(b){return new W(null,2,5,X,[null!=Gg(/[A-Za-z][\w\*\+\?!\-']*/,b)?Ae.a(b):b,a[b]],null)},Ud(a)),b,c);if(zb(a))return Hg(b,Pg,"#js ["," ","]",c,a);if(ba(a))return w(vb.a(c))?wc(b,Mg(a)):wc(b,
a);if(fa(a)){var d=a.name;c=w(function(){var a=null==d;return a?a:/^[\s\xa0]*$/.test(d)}())?"Function":d;return Jg(b,R(["#object[",c,"","]"]))}if(a instanceof Date)return c=function(a,b){for(var c=""+C.a(a);;)if(Q(c)<b)c=[C.a("0"),C.a(c)].join("");else return c},Jg(b,R(['#inst "',""+C.a(a.getUTCFullYear()),"-",c(a.getUTCMonth()+1,2),"-",c(a.getUTCDate(),2),"T",c(a.getUTCHours(),2),":",c(a.getUTCMinutes(),2),":",c(a.getUTCSeconds(),2),".",c(a.getUTCMilliseconds(),3),"-",'00:00"']));if(a instanceof
RegExp)return Jg(b,R(['#"',a.source,'"']));if(w(function(){var b=null==a?null:a.constructor;return null==b?null:b.pa}()))return Jg(b,R(["#object[",a.constructor.pa.replace(RegExp("/","g"),"."),"]"]));d=function(){var b=null==a?null:a.constructor;return null==b?null:b.name}();c=w(function(){var a=null==d;return a?a:/^[\s\xa0]*$/.test(d)}())?"Object":d;return null==a.constructor?Jg(b,R(["#object[",c,"]"])):Jg(b,R(["#object[",c," ",""+C.a(a),"]"]))}
function Pg(a,b,c){var d=Rg.a(c);return w(d)?(c=Gd.f(c,Sg,Og),d.f?d.f(a,b,c):d.call(null,a,b,c)):Og(a,b,c)}function Tg(a,b){var c=new mb;a:{var d=new Mc(c);Pg(K(a),d,b);for(var e=H(M(a)),f=null,g=0,k=0;;)if(k<g){var l=f.L(null,k);wc(d," ");Pg(l,d,b);k+=1}else if(e=H(e))f=e,Td(f)?(e=Fc(f),f=Gc(f),l=e,g=Q(e),e=f,f=l):(l=K(f),wc(d," "),Pg(l,d,b),e=M(f),f=null,g=0),k=0;else break a}return c}function Ug(a,b){return Ld(a)?"":""+C.a(Tg(a,b))}function Vg(a){Kg("\n");return G.b(a,ub),null}
function Wg(a){return Ug(a,tb())}function Xg(a){Kg(Ug(a,tb()))}var Yg=function(){function a(a){var c=null;if(0<arguments.length){c=0;for(var e=Array(arguments.length-0);c<e.length;)e[c]=arguments[c+0],++c;c=new ad(e,0,null)}return b.call(this,c)}function b(a){var b=Gd.f(tb(),vb,!1);return Kg(Ug(a,b))}a.B=0;a.F=function(a){a=H(a);return b(a)};a.l=b;return a}();function Zg(a){var b=Gd.f(tb(),vb,!1);Kg(Ug(a,b));return qb?Vg(tb()):null}
function $g(a,b,c,d,e){return Hg(d,function(a,b,d){var e=ac(a);c.f?c.f(e,b,d):c.call(null,e,b,d);wc(b," ");a=bc(a);return c.f?c.f(a,b,d):c.call(null,a,b,d)},[C.a(a),C.a("{")].join(""),", ","}",e,H(b))}function Qg(a,b,c){var d=Pg,e=(Qd(a),null),f=T(e,0);e=T(e,1);return w(f)?$g([C.a("#:"),C.a(f)].join(""),e,d,b,c):$g(null,a,d,b,c)}lf.prototype.V=r;lf.prototype.O=function(a,b,c){wc(b,"#object [cljs.core.Volatile ");Pg(new v(null,1,[ah,this.state],null),b,c);return wc(b,"]")};ad.prototype.V=r;
ad.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};Ce.prototype.V=r;Ce.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};ng.prototype.V=r;ng.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};Tf.prototype.V=r;Tf.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};Gf.prototype.V=r;Gf.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};ve.prototype.V=r;ve.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};
td.prototype.V=r;td.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};qg.prototype.V=r;qg.prototype.O=function(a,b,c){return Qg(this,b,c)};og.prototype.V=r;og.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};Ag.prototype.V=r;Ag.prototype.O=function(a,b,c){return Hg(b,Pg,"#{"," ","}",c,this)};Ge.prototype.V=r;Ge.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};hf.prototype.V=r;
hf.prototype.O=function(a,b,c){wc(b,"#object [cljs.core.Atom ");Pg(new v(null,1,[ah,this.state],null),b,c);return wc(b,"]")};xg.prototype.V=r;xg.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};W.prototype.V=r;W.prototype.O=function(a,b,c){return Hg(b,Pg,"["," ","]",c,this)};te.prototype.V=r;te.prototype.O=function(a,b){return wc(b,"()")};v.prototype.V=r;v.prototype.O=function(a,b,c){return Qg(this,b,c)};Eg.prototype.V=r;Eg.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};
wg.prototype.V=r;wg.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};re.prototype.V=r;re.prototype.O=function(a,b,c){return Hg(b,Pg,"("," ",")",c,this)};F.prototype.Ob=r;F.prototype.rb=function(a,b){if(b instanceof F)return Yc(this,b);throw Error([C.a("Cannot compare "),C.a(this),C.a(" to "),C.a(b)].join(""));};V.prototype.Ob=r;V.prototype.rb=function(a,b){if(b instanceof V)return we(this,b);throw Error([C.a("Cannot compare "),C.a(this),C.a(" to "),C.a(b)].join(""));};
W.prototype.Ob=r;W.prototype.rb=function(a,b){if(Sd(b)){var c=Q(this),d=Q(b);if(c<d)c=-1;else if(c>d)c=1;else if(0===c)c=0;else a:for(d=0;;){var e=de(qd(this,d),qd(b,d));if(0===e&&d+1<c)d+=1;else{c=e;break a}}return c}throw Error([C.a("Cannot compare "),C.a(this),C.a(" to "),C.a(b)].join(""));};function bh(a,b){this.fa=a;this.value=b;this.h=32768;this.s=1}bh.prototype.sb=function(){w(this.fa)&&(this.value=this.fa.m?this.fa.m():this.fa.call(null),this.fa=null);return this.value};function ch(){}
var dh=function dh(b){if(null!=b&&null!=b.Uc)return b.Uc(b);var c=dh[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=dh._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IEncodeJS.-clj-\x3ejs",b);};function eh(a){return(null!=a?r===a.Tc||(a.dc?0:A(ch,a)):A(ch,a))?dh(a):"string"===typeof a||"number"===typeof a||a instanceof V||a instanceof F?fh(a):Wg(R([a]))}
var fh=function fh(b){if(null==b)return null;if(null!=b?r===b.Tc||(b.dc?0:A(ch,b)):A(ch,b))return dh(b);if(b instanceof V)return Be(b);if(b instanceof F)return""+C.a(b);if(Qd(b)){var c={};b=H(b);for(var d=null,e=0,f=0;;)if(f<e){var g=d.L(null,f),k=T(g,0),l=T(g,1);g=c;k=eh(k);l=fh.a?fh.a(l):fh.call(null,l);g[k]=l;f+=1}else if(b=H(b))Td(b)?(e=Fc(b),b=Gc(b),d=e,e=Q(e)):(d=K(b),e=T(d,0),f=T(d,1),d=c,e=eh(e),f=fh.a?fh.a(f):fh.call(null,f),d[e]=f,b=M(b),d=null,e=0),f=0;else break;return c}if(Md(b)){c=[];
b=H(Z.b(fh,b));d=null;for(f=e=0;;)if(f<e)g=d.L(null,f),c.push(g),f+=1;else if(b=H(b))d=b,Td(d)?(b=Fc(d),f=Gc(d),d=b,e=Q(b),b=f):(b=K(d),c.push(b),b=M(d),d=null,e=0),f=0;else break;return c}return b};function gh(){}var hh=function hh(b,c){if(null!=b&&null!=b.Sc)return b.Sc(b,c);var d=hh[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=hh._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("IEncodeClojure.-js-\x3eclj",b);};
function ih(a,b){var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b,d=G.b(c,jh);return function(a,c,d,k){return function m(e){return(null!=e?r===e.Vd||(e.dc?0:A(gh,e)):A(gh,e))?hh(e,Se(vg,b)):Zd(e)?Fg(Z.b(m,e)):Md(e)?rf.b(Ed(e),Z.b(m,e)):zb(e)?If(Z.b(m,e)):Cb(e)===Object?rf.b($e,function(){return function(a,b,c,d){return function y(f){return new Ce(null,function(a,b,c,d){return function(){for(;;){var a=H(f);if(a){if(Td(a)){var b=Fc(a),c=Q(b),g=new Ee(Array(c),0);a:for(var k=0;;)if(k<c){var n=Rb.b(b,k);n=
new W(null,2,5,X,[d.a?d.a(n):d.call(null,n),m(e[n])],null);g.add(n);k+=1}else{b=!0;break a}return b?He(g.qa(),y(Gc(a))):He(g.qa(),null)}g=K(a);return xd(new W(null,2,5,X,[d.a?d.a(g):d.call(null,g),m(e[g])],null),y(bd(a)))}return null}}}(a,b,c,d),null,null)}}(a,c,d,k)(Ud(e))}()):e}}(b,c,d,w(d)?Ae:C)(a)}function kh(a,b){this.pb=a;this.u=b;this.h=2153775104;this.s=2048}h=kh.prototype;h.toString=function(){return this.pb};h.equiv=function(a){return this.v(null,a)};
h.v=function(a,b){return b instanceof kh&&this.pb===b.pb};h.O=function(a,b){return wc(b,[C.a('#uuid "'),C.a(this.pb),C.a('"')].join(""))};h.N=function(){null==this.u&&(this.u=Wc(this.pb));return this.u};h.rb=function(a,b){return sa(this.pb,b.pb)};
function lh(){function a(){return Math.floor(16*Math.random()).toString(16)}var b=(8|3&Math.floor(16*Math.random())).toString(16);return new kh([C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a("-"),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a("-"),C.a("4"),C.a(a()),C.a(a()),C.a(a()),C.a("-"),C.a(b),C.a(a()),C.a(a()),C.a(a()),C.a("-"),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a()),C.a(a())].join("").toLowerCase(),null)};var mh=new F(null,"form","form",16469056,null),nh=new F(null,"max-count","max-count",-1115250464,null),oh=new V("cljs.spec.alpha","failure","cljs.spec.alpha/failure",188258592),ph=new F("cljs.spec.alpha","*","cljs.spec.alpha/*",-1238084288,null),qh=new V(null,"description","description",-1428560544),rh=new V(null,"path","path",-188191168),sh=new V(null,"req-un","req-un",1074571008),th=new V(null,"opt-un","opt-un",883442496),uh=new F("cljs.core","boolean?","cljs.core/boolean?",1400713761,null),vh=
new F(null,"unc","unc",-465250751,null),wh=new V(null,"joinOnly","joinOnly",121804417),xh=new V(null,"incrementColumnId","incrementColumnId",751660705),yh=new F("cljs.spec.alpha","+","cljs.spec.alpha/+",2101263265,null),zh=new V(null,"p2","p2",905500641),Ah=new V(null,"ret","ret",-468222814),Bh=new V("cljs.spec.alpha","unknown","cljs.spec.alpha/unknown",651034818),Ch=new V("cljs-wdc.core","description","cljs-wdc.core/description",944477378),Dh=new V("cljs.spec.alpha","value","cljs.spec.alpha/value",
1974786274),Eh=new V(null,"gfn","gfn",791517474),Fh=new V("cljs.spec.alpha","name","cljs.spec.alpha/name",205233570),Gh=new V("cljs-wdc.core","id","cljs-wdc.core/id",1004600034),Hh=new F(null,"meta37818","meta37818",-1126624253,null),Ih=new V(null,"pred-exprs","pred-exprs",1792271395),Jh=new V(null,"into","into",-150836029),Kh=new V(null,"keys-pred","keys-pred",858984739),Lh=new V(null,"gen-max","gen-max",-793680445),Mh=new F(null,"meta38743","meta38743",607465955,null),Nh=new V(null,"tableId","tableId",
546917347),Oh=new V("cljs-wdc.core","foreignKey","cljs-wdc.core/foreignKey",-1811153949),Ph=new F("cljs.spec.alpha","alt","cljs.spec.alpha/alt",-2130750332,null),Qh=new V(null,"rep+","rep+",-281382396),wb=new V(null,"meta","meta",1499536964),Rh=new V("cljs-wdc.core","geoRole","cljs-wdc.core/geoRole",-2025580924),Sh=new V(null,"columnRole","columnRole",1500532356),Th=new F("cljs.core","\x3d","cljs.core/\x3d",-1891498332,null),Uh=new V(null,"opt-keys","opt-keys",1262688261),Vh=new F(null,"keys-\x3especnames",
"keys-\x3especnames",1791294693,null),Wh=new F(null,"blockable","blockable",-28395259,null),xb=new V(null,"dup","dup",556298533),Xh=new V("cljs-wdc.core","dataType","cljs-wdc.core/dataType",-1370621563),Yh=new V("cljs.spec.alpha","rep","cljs.spec.alpha/rep",1483217317),Zh=new V(null,"pred","pred",1927423397),$h=new V("cljs-wdc.core","joins","cljs-wdc.core/joins",217773573),ai=new F(null,"meta38571","meta38571",1401815589,null),bi=new F("cljs.core","re-matches","cljs.core/re-matches",2013608485,null),
ci=new F(null,"meta38183","meta38183",-1421584827,null),di=new V(null,"splice","splice",449588165),ei=new F(null,"check?","check?",409539557,null),fi=new F(null,"forms","forms",-608443419,null),gi=new F(null,"opt","opt",845825158,null),hi=new V("cljs.spec.alpha","accept","cljs.spec.alpha/accept",370988198),ii=new V(null,"ks","ks",1900203942),ji=new V("cljs-wdc.core","aggType","cljs-wdc.core/aggType",645032902),ki=new F("cljs.core","count","cljs.core/count",-921270233,null),li=new F("cljs.spec.alpha",
"and","cljs.spec.alpha/and",-2060279705,null),mi=new F(null,"req-un","req-un",-1579864761,null),ni=new F(null,"opt-un","opt-un",-1770993273,null),oi=new V(null,"password","password",417022471),pi=new F("cljs.spec.alpha","coll-of","cljs.spec.alpha/coll-of",1019430407,null),qi=new F("cljs.spec.alpha","cat","cljs.spec.alpha/cat",-1471398329,null),ri=new V(null,"_","_",1453416199),si=new V("cljs.spec.alpha","kind-form","cljs.spec.alpha/kind-form",-1047104697),ti=new V(null,"maybe","maybe",-314397560),
ui=new V(null,"default","default",-1987822328),vi=new V("cljs-wdc.core","tableInfos","cljs-wdc.core/tableInfos",722056584),wi=new V(null,"via","via",-1904457336),xi=new V(null,"finally-block","finally-block",832982472),Di=new F(null,"p1__40455#","p1__40455#",-654016984,null),Ei=new V(null,"connection-data","connection-data",-540759224),Fi=new V(null,"columns","columns",1998437288),Gi=new V(null,"columnType","columnType",-279153623),Hi=new V(null,"columnId","columnId",1025299625),Ii=new F("cljs.core",
"string?","cljs.core/string?",-2072921719,null),Ji=new V(null,"req-specs","req-specs",553962313),Ki=new F("cljs.spec.alpha","or","cljs.spec.alpha/or",-831679639,null),Li=new F(null,"gfn","gfn",-1862918295,null),Mi=new F(null,"meta38037","meta38037",2032867209,null),Ni=new V("cljs.spec.alpha","gfn","cljs.spec.alpha/gfn",-593120375),Oi=new F(null,"gen-max","gen-max",846851082,null),Pi=new V("cljs-wdc.core","columns","cljs-wdc.core/columns",143887434),Qi=new F(null,"meta36311","meta36311",-1802910390,
null),Ri=new F(null,"v","v",1661996586,null),Si=new F(null,"map?","map?",-1780568534,null),Ti=new V("cljs.spec.alpha","spec","cljs.spec.alpha/spec",1947137578),Ui=new V(null,"username","username",1605666410),Vi=new F(null,"pred-exprs","pred-exprs",-862164374,null),Wi=new V(null,"conform-keys","conform-keys",-1800041814),Xi=new F(null,"keys-pred","keys-pred",-1795451030,null),Yi=new V(null,"joins","joins",1033962699),Zi=new F(null,"cpred?","cpred?",35589515,null),$i=new F(null,"p1__39765#","p1__39765#",
-2137443701,null),aj=new F(null,"argm","argm",-181546357,null),bj=new F(null,"fn","fn",465265323,null),cj=new V(null,"filterable","filterable",-1588312341),dj=new V(null,"some","some",-1951079573),ah=new V(null,"val","val",128701612),ej=new V("cljs.spec.alpha","op","cljs.spec.alpha/op",-1269055252),fj=new F("cljs.spec.alpha","nilable","cljs.spec.alpha/nilable",1628308748,null),gj=new V(null,"recur","recur",-437573268),hj=new F(null,"meta39683","meta39683",-812708404,null),ij=new F(null,"opt-keys",
"opt-keys",-1391747508,null),jj=new V("cljs.spec.alpha","v","cljs.spec.alpha/v",552625740),kj=new V(null,"catch-block","catch-block",1175212748),lj=new V(null,"tables","tables",1334623052),mj=new V(null,"aggType","aggType",-1194842228),nj=new F(null,"pred","pred",-727012372,null),oj=new F(null,"p1__39766#","p1__39766#",1643384845,null),Sg=new V(null,"fallback-impl","fallback-impl",-1501286995),pj=new V(null,"unitsFormat","unitsFormat",-1738159603),qj=new F("cljs.core","contains?","cljs.core/contains?",
-976526835,null),rj=new F(null,"map__38852","map__38852",-750906803,null),sj=new F("cljs.core","map?","cljs.core/map?",-1390345523,null),ub=new V(null,"flush-on-newline","flush-on-newline",-151457939),tj=new V("cljs.spec.alpha","cpred","cljs.spec.alpha/cpred",-693471218),uj=new V(null,"p1","p1",-936759954),vj=new F("cljs.core","zipmap","cljs.core/zipmap",-1902130674,null),wj=new V("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),xj=new V(null,"empty","empty",767870958),yj=new F(null,
"cpred","cpred",-540353554,null),zj=new F(null,"%","%",-950237169,null),Aj=new F("cljs.core","map","cljs.core/map",-338988913,null),Bj=new V("cljs.spec.alpha","kvs-\x3emap","cljs.spec.alpha/kvs-\x3emap",579713455),Cj=new V(null,"distinct","distinct",-1788879121),Dj=new V("cljs-wdc.core","alias","cljs-wdc.core/alias",-116192112),Ej=new V(null,"numberFormat","numberFormat",-815732592),Fj=new F(null,"req-specs","req-specs",-2100473456,null),Gj=new F("cljs.spec.alpha","keys","cljs.spec.alpha/keys",1109346032,
null),vb=new V(null,"readably","readably",1129599760),Ig=new V(null,"more-marker","more-marker",-14717935),Hj=new F(null,"re","re",1869207729,null),Ij=new F(null,"conform-keys","conform-keys",-159510287,null),Jj=new V("cljs-wdc.core","tableId","cljs-wdc.core/tableId",-774931151),Kj=new F(null,"kps","kps",-1157342767,null),Lj=new V(null,"reason","reason",-2070751759),Mj=new V("cljs.spec.alpha","invalid","cljs.spec.alpha/invalid",-1220295119),Nj=new F(null,"preds","preds",150921777,null),Oj=new V("cljs-wdc.core",
"password","cljs-wdc.core/password",-2092846383),Pj=new F(null,"kind-form","kind-form",1155997457,null),Qj=new V(null,"req","req",-326448303),Rj=new F(null,"addcv","addcv",-1552991247,null),Sj=new V(null,"alias","alias",-2039751630),Tj=new F(null,"cfns","cfns",1335482066,null),Uj=new V("cljs-wdc.core","columnRole","cljs-wdc.core/columnRole",-1433796910),Vj=new F(null,"nil?","nil?",1612038930,null),Wj=new V("cljs-wdc.core","standardConnections","cljs-wdc.core/standardConnections",1949922387),Xj=new V("cljs-wdc.core",
"incrementColumnId","cljs-wdc.core/incrementColumnId",-1220297357),Yj=new V(null,"assertion-failed","assertion-failed",-970534477),Zj=new F(null,"fn*","fn*",-752876845,null),ak=new F(null,"val","val",1769233139,null),bk=new V(null,"dataType","dataType",1069893619),ck=new F("cljs.core","\x3c\x3d","cljs.core/\x3c\x3d",1677001748,null),dk=new F(null,"p__38176","p__38176",-400426828,null),yb=new V(null,"print-length","print-length",1931866356),ek=new V("cljs.spec.alpha","amp","cljs.spec.alpha/amp",831147508),
fk=new V(null,"id","id",-1388402092),gk=new F(null,"describe-form","describe-form",-1410156588,null),hk=new V(null,"min-count","min-count",1594709013),ik=new V(null,"catch-exception","catch-exception",-1997306795),jk=new V(null,"nil","nil",99600501),kk=new V(null,"kind","kind",-717265803),lk=new V(null,"count","count",2139924085),mk=new F("cljs.core","nil?","cljs.core/nil?",945071861,null),nk=new V(null,"req-keys","req-keys",514319221),ok=new F(null,"k","k",-505765866,null),pk=new V(null,"prev","prev",
-1597069226),qk=new V("cljs-wdc.core","authType","cljs-wdc.core/authType",-1658230698),rk=new V("cljs.spec.alpha","k","cljs.spec.alpha/k",-1602615178),sk=new V("cljs-wdc.core","connection-data","cljs-wdc.core/connection-data",1823136950),tk=new F("cljs.core","fn","cljs.core/fn",-1065745098,null),uk=new F(null,"distinct","distinct",-148347594,null),vk=new V(null,"continue-block","continue-block",-1852047850),wk=new V(null,"opt-specs","opt-specs",-384905450),xk=new V(null,"geoRole","geoRole",422496054),
yk=new V("cljs-wdc.core","tableInfo","cljs-wdc.core/tableInfo",798131255),zk=new V(null,"pred-forms","pred-forms",172611832),Ak=new V(null,"image","image",-58725096),Bk=new F(null,"req","req",1314083224,null),Ck=new F(null,"spec","spec",1988051928,null),Dk=new V("cljs-wdc.core","columnInfo","cljs-wdc.core/columnInfo",447456313),Ek=new F(null,"keys","keys",-1586012071,null),Fk=new F(null,"distinct?","distinct?",-1684357959,null),Gk=new V("cljs-wdc.core","filterable","cljs-wdc.core/filterable",1340216889),
Hk=new V("cljs-wdc.core","standardConnection","cljs-wdc.core/standardConnection",-1229435303),Ik=new V(null,"max-count","max-count",1539185305),Jk=new F(null,"kfn","kfn",729311001,null),Kk=new V("cljs.spec.alpha","kfn","cljs.spec.alpha/kfn",672643897),Lk=new F(null,"meta39837","meta39837",-913589287,null),Mk=new F(null,"gen-into","gen-into",592640985,null),Nk=new F(null,"p__38851","p__38851",1177417946,null),Ok=new V(null,"json","json",1279968570),Pk=new V("cljs-wdc.core","tables","cljs-wdc.core/tables",
-1036613158),Qk=new F(null,"meta38360","meta38360",-1380631046,null),Rk=new V("cljs-wdc.core","phase","cljs-wdc.core/phase",-1247320550),Sk=new V("cljs-wdc.core","numberFormat","cljs-wdc.core/numberFormat",1056872218),Ze=new F(null,"meta34146","meta34146",489799482,null),Tk=new F("cljs.core","coll?","cljs.core/coll?",1208130522,null),Uk=new F(null,"id","id",252129435,null),Vk=new V("cljs-wdc.core","unitsFormat","cljs-wdc.core/unitsFormat",704346779),Rg=new V(null,"alt-impl","alt-impl",670969595),
Wk=new F(null,"specs","specs",-1227865028,null),el=new F(null,"count","count",-514511684,null),fl=new V("cljs-wdc.core","username","cljs-wdc.core/username",-239413828),gl=new F(null,"req-keys","req-keys",-2140116548,null),hl=new F(null,"min-count","min-count",-1059726756,null),il=new F(null,"opts","opts",1795607228,null),jl=new F(null,"kind","kind",923265724,null),jh=new V(null,"keywordize-keys","keywordize-keys",1310784252),kl=new F(null,"cform","cform",1319506748,null),ll=new F(null,"opt-specs",
"opt-specs",1255626077,null),ml=new F(null,"map__38177","map__38177",171043165,null),nl=new F(null,"conform-all","conform-all",-980179459,null),ol=new V("cljs.spec.alpha","conform-all","cljs.spec.alpha/conform-all",45201917),pl=new V("cljs.spec.alpha","alt","cljs.spec.alpha/alt",523685437),ql=new V(null,"foreignKey","foreignKey",-1531524227),rl=new V(null,"forms","forms",2045992350),sl=new V("cljs.spec.alpha","pred","cljs.spec.alpha/pred",-798342594),tl=new V("cljs.spec.alpha","nil","cljs.spec.alpha/nil",
1733813950),ul=new V(null,"ps","ps",292358046),vl=new F(null,"k-\x3es","k-\x3es",-1685112801,null),wl=new V("cljs-wdc.core","state","cljs-wdc.core/state",65423551),xl=new V("cljs-wdc.core","joinOnly","cljs-wdc.core/joinOnly",1993153759),yl=new F("cljs.spec.alpha","conformer","cljs.spec.alpha/conformer",2140085535,null),zl=new V(null,"in","in",-1531184865),Al=new V("cljs.spec.alpha","describe","cljs.spec.alpha/describe",1883026911),Bl=new F(null,"conform-into","conform-into",-1039113729,null),Cl=new F("cljs.spec.alpha",
"\x26","cljs.spec.alpha/\x26",1635809823,null),Dl=new V(null,"opt","opt",-794706369),El=new F(null,"meta38989","meta38989",-1905683777,null),Fl=new V("cljs.spec.alpha","pcat","cljs.spec.alpha/pcat",26406623),Hl=new F(null,"pred-forms","pred-forms",1813143359,null),Il=new V("cljs-wdc.core","columnType","cljs-wdc.core/columnType",2090181503),Jl=new F(null,"f","f",43394975,null),Kl=new F("cljs.spec.alpha","?","cljs.spec.alpha/?",1605136319,null),Ll=new V("cljs-wdc.core","columnId","cljs-wdc.core/columnId",
-897186817);var Ml,Nl=function Nl(b){if(null!=b&&null!=b.Db)return b.Db();var c=Nl[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Nl._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("Channel.close!",b);},Ol=function Ol(b){if(null!=b&&null!=b.uc)return!0;var c=Ol[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Ol._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("Handler.active?",b);},Pl=function Pl(b){if(null!=b&&null!=b.vc)return b.fa;var c=Pl[q(null==b?null:b)];if(null!=
c)return c.a?c.a(b):c.call(null,b);c=Pl._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("Handler.commit",b);},Ql=function Ql(b,c){if(null!=b&&null!=b.tc)return b.tc(0,c);var d=Ql[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Ql._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("Buffer.add!*",b);},Rl=function Rl(b){switch(arguments.length){case 1:return Rl.a(arguments[0]);case 2:return Rl.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),
C.a(arguments.length)].join(""));}};Rl.a=function(a){return a};Rl.b=function(a,b){return Ql(a,b)};Rl.B=2;function Sl(a,b,c,d,e){for(var f=0;;)if(f<e)c[d+f]=a[b+f],f+=1;else break}function Tl(a,b,c,d){this.head=a;this.J=b;this.length=c;this.c=d}Tl.prototype.pop=function(){if(0===this.length)return null;var a=this.c[this.J];this.c[this.J]=null;this.J=(this.J+1)%this.c.length;--this.length;return a};Tl.prototype.unshift=function(a){this.c[this.head]=a;this.head=(this.head+1)%this.c.length;this.length+=1;return null};function Ul(a,b){a.length+1===a.c.length&&a.resize();a.unshift(b)}
Tl.prototype.resize=function(){var a=Array(2*this.c.length);return this.J<this.head?(Sl(this.c,this.J,a,0,this.length),this.J=0,this.head=this.length,this.c=a):this.J>this.head?(Sl(this.c,this.J,a,0,this.c.length-this.J),Sl(this.c,0,a,this.c.length-this.J,this.head),this.J=0,this.head=this.length,this.c=a):this.J===this.head?(this.head=this.J=0,this.c=a):null};function Vl(a,b){for(var c=a.length,d=0;;)if(d<c){var e=a.pop();(b.a?b.a(e):b.call(null,e))&&a.unshift(e);d+=1}else break}
function Wl(a){return new Tl(0,0,0,Array(a))}function Xl(a,b){this.D=a;this.n=b;this.h=2;this.s=0}function Yl(a){return a.D.length===a.n}Xl.prototype.tc=function(a,b){Ul(this.D,b);return this};Xl.prototype.P=function(){return this.D.length};if("undefined"===typeof Zl)var Zl={};var $l;
function am(){var a=aa.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!za("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow;a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host;a=la(function(a){if(("*"==d||a.origin==d)&&a.data==
c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&!za("Trident")&&!za("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(void 0!==c.next){c=c.next;var a=c.lc;c.lc=null;a()}};return function(a){d.next={lc:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(a){var b=document.createElement("SCRIPT");
b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){aa.setTimeout(a,0)}};var bm=Wl(32),cm=!1,dm=!1;function em(){cm=!0;dm=!1;for(var a=0;;){var b=bm.pop();if(null!=b&&(b.m?b.m():b.call(null),1024>a)){a+=1;continue}break}cm=!1;return 0<bm.length?fm.m?fm.m():fm.call(null):null}function fm(){if(dm&&cm)return null;dm=!0;!fa(aa.setImmediate)||aa.Window&&aa.Window.prototype&&!za("Edge")&&aa.Window.prototype.setImmediate==aa.setImmediate?($l||($l=am()),$l(em)):aa.setImmediate(em)}function gm(a){Ul(bm,a);fm()};var hm;
function im(a){"undefined"===typeof hm&&(hm=function(a,c){this.ca=a;this.ud=c;this.h=425984;this.s=0},hm.prototype.I=function(a,c){return new hm(this.ca,c)},hm.prototype.G=function(){return this.ud},hm.prototype.sb=function(){return this.ca},hm.Ga=function(){return new W(null,2,5,X,[ak,Qi],null)},hm.va=!0,hm.pa="cljs.core.async.impl.channels/t_cljs$core$async$impl$channels36310",hm.ya=function(a,c){return wc(c,"cljs.core.async.impl.channels/t_cljs$core$async$impl$channels36310")});return new hm(a,$e)}
function jm(a,b){this.Eb=a;this.ca=b}function km(a){return Ol(a.Eb)}function lm(a,b,c,d,e,f,g){this.Bb=a;this.Wb=b;this.$a=c;this.Vb=d;this.D=e;this.closed=f;this.ta=g}function mm(a){for(;;){var b=a.$a.pop();if(null!=b){var c=b.Eb;gm(function(a){return function(){return a.a?a.a(!0):a.call(null,!0)}}(c.fa,c,b.ca,b,a))}break}Vl(a.$a,ef());a.Db()}
function nm(a,b,c){var d=a.closed;if(d)return im(!d);if(w(function(){var b=a.D;return w(b)?Ab(Yl(a.D)):b}())){var e=kd(a.ta.b?a.ta.b(a.D,b):a.ta.call(null,a.D,b)),f=function(){for(var b=Dd;;)if(0<a.Bb.length&&0<Q(a.D)){var c=a.Bb.pop(),f=c.fa,g=a.D.D.pop();b=Cd.b(b,function(a,b,c){return function(){return b.a?b.a(c):b.call(null,c)}}(b,f,g,c,e,d,a))}else return b}();e&&mm(a);if(H(f)){f=H(f);c=null;for(var g=0,k=0;;)if(k<g){var l=c.L(null,k);gm(l);k+=1}else if(f=H(f))c=f,Td(c)?(f=Fc(c),k=Gc(c),c=f,
g=Q(f),f=k):(f=K(c),gm(f),f=M(c),c=null,g=0),k=0;else break}return im(!0)}f=function(){for(;;){var b=a.Bb.pop();if(w(b)){if(w(!0))return b}else return null}}();if(w(f))return c=Pl(f),gm(function(a){return function(){return a.a?a.a(b):a.call(null,b)}}(c,f,d,a)),im(!0);64<a.Vb?(a.Vb=0,Vl(a.$a,km)):a.Vb+=1;w(c.cc(null))&&Ul(a.$a,new jm(c,b));return null}
function om(a,b){if(null!=a.D&&0<Q(a.D)){var c=b.fa;if(w(c)){var d=a.D.D.pop();var e=0<a.$a.length?function(){for(var b=Dd;;){var c=a.$a.pop(),d=c.ca;c=c.Eb.fa;b=w(c)?Cd.b(b,c):b;d=w(c)?kd(a.ta.b?a.ta.b(a.D,d):a.ta.call(null,a.D,d)):null;if(!(Ab(d)&&Ab(Yl(a.D))&&0<a.$a.length))return new W(null,2,5,X,[d,b],null)}}():null,f=T(e,0),g=T(e,1);w(f)&&mm(a);for(var k=H(g),l=null,m=0,n=0;;)if(n<m){var p=l.L(null,n);gm(function(a,b,c,d,e){return function(){return e.a?e.a(!0):e.call(null,!0)}}(k,l,m,n,p,d,
e,f,g,c,c,a));n+=1}else{var u=H(k);if(u){p=u;if(Td(p))k=Fc(p),n=Gc(p),l=k,m=Q(k),k=n;else{var t=K(p);gm(function(a,b,c,d,e){return function(){return e.a?e.a(!0):e.call(null,!0)}}(k,l,m,n,t,p,u,d,e,f,g,c,c,a));k=M(p);l=null;m=0}n=0}else break}return im(d)}return null}d=function(){for(;;){var b=a.$a.pop();if(w(b)){if(Ol(b.Eb))return b}else return null}}();if(w(d))return c=Pl(d.Eb),gm(function(a){return function(){return a.a?a.a(!0):a.call(null,!0)}}(c,d,a)),im(d.ca);if(w(a.closed))return w(a.D)&&(a.ta.a?
a.ta.a(a.D):a.ta.call(null,a.D)),w(w(!0)?b.fa:!0)?(d=function(){var b=a.D;return w(b)?0<Q(a.D):b}(),d=w(d)?a.D.D.pop():null,im(d)):null;64<a.Wb?(a.Wb=0,Vl(a.Bb,Ol)):a.Wb+=1;w(b.cc(null))&&Ul(a.Bb,b);return null}
lm.prototype.Db=function(){var a=this;if(!a.closed)for(a.closed=!0,w(function(){var b=a.D;return w(b)?0===a.$a.length:b}())&&(a.ta.a?a.ta.a(a.D):a.ta.call(null,a.D));;){var b=a.Bb.pop();if(null!=b){var c=b.fa,d=w(function(){var b=a.D;return w(b)?0<Q(a.D):b}())?a.D.D.pop():null;gm(function(a,b){return function(){return a.a?a.a(b):a.call(null,b)}}(c,d,b,this))}else break}return null};function pm(a){console.log(a);return null}
function qm(a,b){var c=w(null)?null:pm;c=c.a?c.a(b):c.call(null,b);return null==c?a:Rl.b(a,c)}
function rm(a){return new lm(Wl(32),0,Wl(32),0,a,!1,function(){return function(a){return function(){function b(b,c){try{return a.b?a.b(b,c):a.call(null,b,c)}catch(k){return qm(b,k)}}function d(b){try{return a.a?a.a(b):a.call(null,b)}catch(g){return qm(b,g)}}var e=null;e=function(a,c){switch(arguments.length){case 1:return d.call(this,a);case 2:return b.call(this,a,c)}throw Error("Invalid arity: "+(arguments.length-1));};e.a=d;e.b=b;return e}()}(w(null)?null.a?null.a(Rl):null.call(null,Rl):Rl)}())}
;var sm;
function tm(a){"undefined"===typeof sm&&(sm=function(a,c){this.fa=a;this.vd=c;this.h=393216;this.s=0},sm.prototype.I=function(a,c){return new sm(this.fa,c)},sm.prototype.G=function(){return this.vd},sm.prototype.uc=function(){return!0},sm.prototype.cc=function(){return!0},sm.prototype.vc=function(){return this.fa},sm.Ga=function(){return new W(null,2,5,X,[Jl,Hh],null)},sm.va=!0,sm.pa="cljs.core.async.impl.ioc-helpers/t_cljs$core$async$impl$ioc_helpers37817",sm.ya=function(a,c){return wc(c,"cljs.core.async.impl.ioc-helpers/t_cljs$core$async$impl$ioc_helpers37817")});
return new sm(a,$e)}function um(a){try{var b=a[0];return b.a?b.a(a):b.call(null,a)}catch(c){if(c instanceof Object)throw b=c,a[6].Db(),b;throw c;}}function vm(a,b){var c=om(b,tm(function(b){a[2]=b;a[1]=4;return um(a)}));return w(c)?(a[2]=ec(c),a[1]=4,gj):null}function wm(a,b,c,d){c=nm(c,d,tm(function(c){a[2]=c;a[1]=b;return um(a)}));return w(c)?(a[2]=ec(c),a[1]=b,gj):null}function xm(a,b){var c=a[6];null!=b&&nm(c,b,tm(function(){return function(){return null}}(c)));c.Db();return c}
function ym(a){for(;;){var b=a[4],c=kj.a(b),d=ik.a(b),e=a[5];if(w(function(){var a=e;return w(a)?Ab(b):a}()))throw e;if(w(function(){var a=e;return w(a)?(a=c,w(a)?O.b(ui,d)||e instanceof d:a):a}())){a[1]=c;a[2]=e;a[5]=null;a[4]=Gd.l(b,kj,null,R([ik,null]));break}if(w(function(){var a=e;return w(a)?Ab(c)&&Ab(xi.a(b)):a}()))a[4]=pk.a(b);else{if(w(function(){var a=e;return w(a)?(a=Ab(c))?xi.a(b):a:a}())){a[1]=xi.a(b);a[4]=Gd.f(b,xi,null);break}if(w(function(){var a=Ab(e);return a?xi.a(b):a}())){a[1]=
xi.a(b);a[4]=Gd.f(b,xi,null);break}if(Ab(e)&&Ab(xi.a(b))){a[1]=vk.a(b);a[4]=pk.a(b);break}throw Error("No matching clause");}}};for(var zm=Array(1),Am=0;;)if(Am<zm.length)zm[Am]=null,Am+=1;else break;function Bm(a){a=O.b(a,0)?null:a;return rm("number"===typeof a?new Xl(Wl(a),a):a)}
(function(a){"undefined"===typeof Ml&&(Ml=function(a,c,d){this.fa=a;this.kc=c;this.wd=d;this.h=393216;this.s=0},Ml.prototype.I=function(a,c){return new Ml(this.fa,this.kc,c)},Ml.prototype.G=function(){return this.wd},Ml.prototype.uc=function(){return!0},Ml.prototype.cc=function(){return this.kc},Ml.prototype.vc=function(){return this.fa},Ml.Ga=function(){return new W(null,3,5,X,[Jl,Wh,Mi],null)},Ml.va=!0,Ml.pa="cljs.core.async/t_cljs$core$async38036",Ml.ya=function(a,c){return wc(c,"cljs.core.async/t_cljs$core$async38036")});
return new Ml(a,!0,$e)})(function(){return null});function Cm(a,b,c){if(se(c))return c=Se(U,Z.b(a,c)),b.a?b.a(c):b.call(null,c);if(Zd(c))return c=Fg(Z.b(a,c)),b.a?b.a(c):b.call(null,c);if(Rd(c))return c=Hb(function(b,c){return Cd.b(b,a.a?a.a(c):a.call(null,c))},c,c),b.a?b.a(c):b.call(null,c);Md(c)&&(c=rf.b(Ed(c),Z.b(a,c)));return b.a?b.a(c):b.call(null,c)}var Dm=function Dm(b,c){return Cm(ff(Dm,b),b,c)};var Em,Fm,Gm,Hm,Im,Jm,Km,Lm=function Lm(b,c){if(null!=b&&null!=b.eb)return b.eb(b,c);var d=Lm[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Lm._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("Spec.conform*",b);},Mm=function Mm(b,c,d,e,f){if(null!=b&&null!=b.fb)return b.fb(b,c,d,e,f);var g=Mm[q(null==b?null:b)];if(null!=g)return g.R?g.R(b,c,d,e,f):g.call(null,b,c,d,e,f);g=Mm._;if(null!=g)return g.R?g.R(b,c,d,e,f):g.call(null,b,c,d,e,f);throw B("Spec.explain*",b);},
Nm=function Nm(b,c){if(null!=b&&null!=b.gb)return b.gb(b,c);var d=Nm[q(null==b?null:b)];if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);d=Nm._;if(null!=d)return d.b?d.b(b,c):d.call(null,b,c);throw B("Spec.with-gen*",b);};if("undefined"===typeof Om){var Om;Om=new hf($e,null,null,null)}function Pm(a){if(ze(a)){var b=ec(Om);a=G.b(b,a);if(ze(a))a:for(;;)if(ze(a))a=G.b(b,a);else{b=a;break a}else b=a;return b}return a}
function Qm(a){if(ze(a)){var b=Pm(a);if(w(b))return b;throw Error([C.a("Unable to resolve spec: "),C.a(a)].join(""));}return a}function Rm(a){return null!=a&&r===a.mb?a:null}function Sm(a){var b=ej.a(a);return w(b)?a:b}function Tm(a,b){if(ze(a))var c=a;else w(Sm(a))?c=Gd.f(a,Fh,b):null!=a&&(a.h&131072||r===a.ac)?(c=Gd.f(Kd(a),Fh,b),c=fa(a)?new Id(a,c):null==a?null:hc(a,c)):c=null;return c}function Um(a){return ze(a)?a:w(Sm(a))?Fh.a(a):null!=a&&(a.h&131072||r===a.ac)?Fh.a(Kd(a)):null}
function Vm(a){var b=function(){var b=(b=ze(a))?Pm(a):b;if(w(b))return b;b=Rm(a);if(w(b))return b;b=Sm(a);return w(b)?b:null}();return w(Sm(b))?Tm(Wm.b?Wm.b(b,null):Wm.call(null,b,null),Um(b)):b}function Xm(a){var b=Vm(a);if(w(b))return b;if(ze(a))throw Error([C.a("Unable to resolve spec: "),C.a(a)].join(""));return null}
var Ym=function Ym(b){switch(arguments.length){case 1:return Ym.a(arguments[0]);case 2:return Ym.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};Ym.a=function(a){if(null!=a&&null!=a.Da)return a.Da(a);var b=Ym[q(null==a?null:a)];if(null!=b)return b.a?b.a(a):b.call(null,a);b=Ym._;if(null!=b)return b.a?b.a(a):b.call(null,a);throw B("Specize.specize*",a);};
Ym.b=function(a,b){if(null!=a&&null!=a.Ea)return a.Ea(a,b);var c=Ym[q(null==a?null:a)];if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);c=Ym._;if(null!=c)return c.b?c.b(a,b):c.call(null,a,b);throw B("Specize.specize*",a);};Ym.B=2;V.prototype.Da=function(){return Ym.a(Qm(this))};V.prototype.Ea=function(){return Ym.a(Qm(this))};F.prototype.Da=function(){return Ym.a(Qm(this))};F.prototype.Ea=function(){return Ym.a(Qm(this))};
Ym._=function(){function a(a,b){return Zm?Zm(b,a,null,null):$m.call(null,b,a,null,null)}function b(a){return Zm?Zm(Bh,a,null,null):$m.call(null,Bh,a,null,null)}var c=null;c=function(c,e){switch(arguments.length){case 1:return b.call(this,c);case 2:return a.call(this,c,e)}throw Error("Invalid arity: "+(arguments.length-1));};c.a=b;c.b=a;return c}();
var an=function an(b){switch(arguments.length){case 1:return an.a(arguments[0]);case 2:return an.b(arguments[0],arguments[1]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}};an.a=function(a){var b=Rm(a);return w(b)?b:Ym.a(a)};an.b=function(a,b){var c=Rm(a);return w(c)?c:Ym.b(a,b)};an.B=2;function bn(a){return xe(Mj,a)}
function cn(a){return Zd(a)?Dm(function(a){var b=(b=a instanceof F)?ye(a):b;return w(b)?Zc.a(Be(a)):Zd(a)&&O.b(bj,K(a))&&O.b(new W(null,1,5,X,[zj],null),Ad(a))?Bd(a):a},a):w(function(){var b=a instanceof F;return b?ye(a):b}())?Zc.a(Be(a)):a}function dn(a,b){var c=Pm(a);return w(Sm(c))?Gd.f(c,Ni,b):Nm(an.a(c),b)}function en(a,b){var c=Dd,d=Dd,e=Dd;c=Mm(an.a(a),c,d,e,b);return w(c)?Ld(c)?null:new v(null,3,[wj,c,Ti,a,Dh,b],null):null}
function fn(a){if(w(a)){var b=ge(function(a){return-Q(rh.a(a))},wj.a(a));return Yg.l(R([function(){var c=new mb,d=qb,e=ob;qb=!0;ob=function(a,b,c){return function(a){return c.append(a)}}(d,e,c,b);try{for(var f=H(b),g=null,k=0,l=0;;)if(l<k){var m=g.L(null,l),n=null!=m&&(m.h&64||r===m.Z)?Se(ug,m):m,p=n,u=G.b(n,rh),t=G.b(n,Zh),z=G.b(n,ah),x=G.b(n,Lj),y=G.b(n,wi),D=G.b(n,zl);Ld(D)||Yg.l(R(["In:",Wg(R([D])),""]));Yg.l(R(["val: "]));Xg(R([z]));Yg.l(R([" fails"]));Ld(y)||Yg.l(R([" spec:",Wg(R([Bd(y)]))]));
Ld(u)||Yg.l(R([" at:",Wg(R([u]))]));Yg.l(R([" predicate: "]));Xg(R([cn(t)]));w(x)&&Yg.l(R([", ",x]));var I=H(p);p=null;for(var N=0,S=0;;)if(S<N){var da=p.L(null,S),J=T(da,0),Gl=T(da,1);w(function(){var a=new Ag(null,new v(null,6,[rh,null,Zh,null,wi,null,ah,null,Lj,null,zl,null],null),null);return a.a?a.a(J):a.call(null,J)}())||(Yg.l(R(["\n\t",Wg(R([J]))," "])),Xg(R([Gl])));S+=1}else{var ea=H(I);if(ea){var ca=ea;if(Td(ca)){var qa=Fc(ca),oa=Gc(ca);ca=qa;var ua=Q(qa);I=oa;p=ca;N=ua}else{var Ja=K(ca),
pa=T(Ja,0),Y=T(Ja,1);w(function(){var a=new Ag(null,new v(null,6,[rh,null,Zh,null,wi,null,ah,null,Lj,null,zl,null],null),null);return a.a?a.a(pa):a.call(null,pa)}())||(Yg.l(R(["\n\t",Wg(R([pa]))," "])),Xg(R([Y])));I=M(ca);p=null;N=0}S=0}else break}Vg(null);l+=1}else{var ta=H(f);if(ta){p=ta;if(Td(p)){var eb=Fc(p),Ya=Gc(p);p=eb;var Ma=Q(eb);f=Ya;g=p;k=Ma}else{var Ra=K(p),Za=null!=Ra&&(Ra.h&64||r===Ra.Z)?Se(ug,Ra):Ra;N=Za;var Nb=G.b(Za,rh),mc=G.b(Za,Zh),ud=G.b(Za,ah),vd=G.b(Za,Lj),Yd=G.b(Za,wi),We=G.b(Za,
zl);Ld(We)||Yg.l(R(["In:",Wg(R([We])),""]));Yg.l(R(["val: "]));Xg(R([ud]));Yg.l(R([" fails"]));Ld(Yd)||Yg.l(R([" spec:",Wg(R([Bd(Yd)]))]));Ld(Nb)||Yg.l(R([" at:",Wg(R([Nb]))]));Yg.l(R([" predicate: "]));Xg(R([cn(mc)]));w(vd)&&Yg.l(R([", ",vd]));var Xe=H(N);N=null;for(ca=S=0;;)if(ca<S){var Xk=N.L(null,ca),wf=T(Xk,0),yi=T(Xk,1);w(function(){var a=new Ag(null,new v(null,6,[rh,null,Zh,null,wi,null,ah,null,Lj,null,zl,null],null),null);return a.a?a.a(wf):a.call(null,wf)}())||(Yg.l(R(["\n\t",Wg(R([wf])),
" "])),Xg(R([yi])));ca+=1}else{var Yk=H(Xe);if(Yk){var Od=Yk;if(Td(Od)){var Zk=Fc(Od),fo=Gc(Od);Od=Zk;var go=Q(Zk);Xe=fo;N=Od;S=go}else{var $k=K(Od),zi=T($k,0),ho=T($k,1);w(function(){var a=new Ag(null,new v(null,6,[rh,null,Zh,null,wi,null,ah,null,Lj,null,zl,null],null),null);return a.a?a.a(zi):a.call(null,zi)}())||(Yg.l(R(["\n\t",Wg(R([zi]))," "])),Xg(R([ho])));Xe=M(Od);N=null;S=0}ca=0}else break}Vg(null);f=M(p);g=null;k=0}l=0}else break}var Ai=H(a);f=null;for(k=g=0;;)if(k<g){var al=f.L(null,k),
Bi=T(al,0),io=T(al,1);w(function(){var a=new Ag(null,new v(null,1,[wj,null],null),null);return a.a?a.a(Bi):a.call(null,Bi)}())||(Yg.l(R([Wg(R([Bi]))," "])),Xg(R([io])),Vg(null));k+=1}else{var bl=H(Ai);if(bl){l=bl;if(Td(l)){var cl=Fc(l),jo=Gc(l);l=cl;var ko=Q(cl);Ai=jo;f=l;g=ko}else{var dl=K(l),Ci=T(dl,0),lo=T(dl,1);w(function(){var a=new Ag(null,new v(null,1,[wj,null],null),null);return a.a?a.a(Ci):a.call(null,Ci)}())||(Yg.l(R([Wg(R([Ci]))," "])),Xg(R([lo])),Vg(null));Ai=M(l);f=null;g=0}k=0}else break}}finally{ob=
e,qb=d}return""+C.a(c)}()]))}return Zg(R(["Success!"]))}function gn(a){fn.a?fn.a(a):fn.call(null,a)}function hn(a,b,c){var d=Rm(c);w(d)||(d=Sm(c),d=w(d)?d:G.b(ec(Om),c));b=w(d)?c:Zm?Zm(b,c,null,null):$m.call(null,b,c,null,null);kf.w(Om,Gd,a,Tm(b,a))}
function jn(a,b,c,d){if(w(a)){var e=Xm(a);if(w(e))return Lm(an.a(e),b);if(fa(a)||(null!=a?r===a.Pc||(a.dc?0:A(Ib,a)):A(Ib,a))||(null!=a?a.h&1||r===a.Wd||(a.h?0:A(Jb,a)):A(Jb,a)))return w(d)?a.a?a.a(b):a.call(null,b):w(a.a?a.a(b):a.call(null,b))?b:Mj;throw Error([C.a(Wg(R([c]))),C.a(" is not a fn, expected predicate fn")].join(""));}return b}function kn(a,b){var c=an.a(a);return Ab(bn(Lm(c,b)))}
function ln(a,b,c,d,e,f){b=Vm(b);w(Rm(b))?(a=Um(b),d=w(a)?Cd.b(d,a):d,c=Mm(b,c,d,e,f)):c=new W(null,1,5,X,[new v(null,5,[rh,c,Zh,a,ah,f,wi,d,zl,e],null)],null);return c}
var mn=function mn(b){var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b,d=G.b(c,Dl),e=G.b(c,sh),f=G.b(c,th),g=G.b(c,Eh),k=G.b(c,Ih),l=G.b(c,Kh),m=G.b(c,Uh),n=G.b(c,Ji),p=G.b(c,Qj),u=G.b(c,nk),t=G.b(c,wk),z=G.b(c,zk),x=Cg(Le.b(u,m),Le.b(n,t)),y=function(b){return function(c){var d=b.a?b.a(c):b.call(null,c);return w(d)?d:c}}(x,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),D=lh();"undefined"===typeof Em&&(Em=function(b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,Ma,Ra){this.ma=b;this.Fd=c;this.Od=d;this.Id=e;this.ra=f;this.Jc=g;this.Xb=
k;this.jc=l;this.Gd=m;this.Nd=n;this.Jd=p;this.Ld=y;this.id=t;this.Md=x;this.Hd=u;this.rd=z;this.pd=D;this.Kc=Ma;this.xd=Ra;this.h=393216;this.s=0},Em.prototype.I=function(){return function(b,c){return new Em(this.ma,this.Fd,this.Od,this.Id,this.ra,this.Jc,this.Xb,this.jc,this.Gd,this.Nd,this.Jd,this.Ld,this.id,this.Md,this.Hd,this.rd,this.pd,this.Kc,c)}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.G=function(){return function(){return this.xd}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.Da=
function(){return function(){return this}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.Ea=function(){return function(){return this}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.mb=r,Em.prototype.eb=function(){return function(b,c){if(w(this.Xb.a?this.Xb.a(c):this.Xb.call(null,c))){var d=ec(Om),e=H(c),f=K(e);M(e);T(f,0);T(f,1);for(f=e=c;;){var g=f,k=H(g);f=K(k);var l=M(k);k=f;f=T(k,0);k=T(k,1);if(w(g)){g=this.ma.a?this.ma.a(f):this.ma.call(null,f);g=G.b(d,g);if(w(g)){var m=k;g=Lm(an.a(g),
m);if(w(bn(g)))return Mj;e=g===k?e:Gd.f(e,f,g)}f=l}else return e}}else return Mj}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.fb=function(b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,Ma){return function(I,N,J,ea,ca){var S=this,da=this;if(Qd(ca)){var oa=ec(Om);return Te(Le,function(){var I=H(gf(me,Z.f(function(){return function(b,c){return w(b.a?b.a(ca):b.call(null,ca))?null:c}}(oa,da,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,Ma),S.Jc,S.Kc)));return I?Z.b(function(){return function(b){return new v(null,5,[rh,
N,Zh,b,ah,ca,wi,J,zl,ea],null)}}(I,I,oa,da,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,Ma),I):null}(),Z.b(function(b){return function(c){var d=T(c,0);c=T(c,1);var e=!ae(b,S.ma.a?S.ma.a(d):S.ma.call(null,d));e||(e=S.ma.a?S.ma.a(d):S.ma.call(null,d),e=Ab(bn(jn(e,c,d,null))));return w(e)?null:ln(S.ma.a?S.ma.a(d):S.ma.call(null,d),S.ma.a?S.ma.a(d):S.ma.call(null,d),Cd.b(N,d),J,Cd.b(ea,d),c)}}(oa,da,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,Ma),H(ca)))}return new W(null,1,5,X,[new v(null,5,[rh,N,Zh,Si,ah,ca,wi,J,zl,ea],
null)],null)}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.prototype.gb=function(){return function(b,c){var d=Gd.f(this.jc,Eh,c);return mn.a?mn.a(d):mn.call(null,d)}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.Ga=function(){return function(){return new W(null,19,5,X,[Vh,gi,mi,ni,Li,Vi,Xi,aj,ij,Fj,dk,Bk,Uk,gl,ll,ml,vl,Hl,ci],null)}}(x,y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z),Em.va=!0,Em.pa="cljs.spec.alpha/t_cljs$spec$alpha38182",Em.ya=function(){return function(b,c){return wc(c,"cljs.spec.alpha/t_cljs$spec$alpha38182")}}(x,
y,D,b,c,c,d,e,f,g,k,l,m,n,p,u,t,z));return new Em(y,d,e,f,g,k,l,c,m,n,b,p,D,u,t,c,x,z,$e)};function $m(a){switch(arguments.length){case 4:return Zm(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return nn(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);default:throw Error([C.a("Invalid arity: "),C.a(arguments.length)].join(""));}}function Zm(a,b,c,d){return nn(a,b,c,d,null)}
function nn(a,b,c,d,e){if(w(Rm(b)))return w(c)?dn(b,c):b;if(w(Sm(b)))return Wm.b?Wm.b(b,c):Wm.call(null,b,c);if(ze(b))return a=Xm(b),w(c)?dn(a,c):a;"undefined"===typeof Fm&&(Fm=function(a,b,c,d,e,n){this.form=a;this.oa=b;this.ra=c;this.Ub=d;this.Mc=e;this.yd=n;this.h=393216;this.s=0},Fm.prototype.I=function(a,b){return new Fm(this.form,this.oa,this.ra,this.Ub,this.Mc,b)},Fm.prototype.G=function(){return this.yd},Fm.prototype.Da=function(){return this},Fm.prototype.Ea=function(){return this},Fm.prototype.mb=
r,Fm.prototype.eb=function(a,b){var c=this.oa.a?this.oa.a(b):this.oa.call(null,b);return w(this.Ub)?c:w(c)?b:Mj},Fm.prototype.fb=function(a,b,c,d,e){return w(bn(jn(this.oa,e,this.form,this.Ub)))?new W(null,1,5,X,[new v(null,5,[rh,b,Zh,this.form,ah,e,wi,c,zl,d],null)],null):null},Fm.prototype.gb=function(a,b){return nn(this.form,this.oa,b,this.Ub,this.Mc)},Fm.Ga=function(){return new W(null,6,5,X,[mh,nj,Li,Zi,vh,Qk],null)},Fm.va=!0,Fm.pa="cljs.spec.alpha/t_cljs$spec$alpha38359",Fm.ya=function(a,b){return wc(b,
"cljs.spec.alpha/t_cljs$spec$alpha38359")});return new Fm(a,b,c,d,e,$e)}function on(a){a.pc=r;a.Qb=function(){return function(){return Rb.b(a,0)}}(a);a.Rb=function(){return function(){return Rb.b(a,1)}}(a);return a}function pn(a,b,c){var d=H(b);K(d);M(d);d=H(c);K(d);M(d);for(d=c;;){c=a;b=H(b);a=K(b);b=M(b);var e=H(d);d=K(e);e=M(e);var f=d;d=e;if(w(a)){c=jn(a,c,f,null);if(w(bn(c)))return Mj;a=c}else return c}}
function qn(a,b,c,d,e,f){var g=H(a);K(g);M(g);g=H(b);K(g);M(g);for(g=b;;){b=f;a=H(a);f=K(a);a=M(a);var k=H(g);g=K(k);var l=M(k);k=g;if(w(k)){g=jn(k,b,f,null);if(w(bn(g)))return ln(f,k,c,d,e,b);b=a;k=l;f=g;a=b;g=k}else return null}}
function rn(a,b,c,d,e,f,g,k,l,m){b=w(b)?b:Md;c=w(c)?c:Tk;return Ab(Ab(bn(jn(b,a,Bh,null))))?ln(c,b,k,l,m,a):w(w(e)?Ue(e,Je(e,a)):e)?new W(null,1,5,X,[new v(null,5,[rh,k,Zh,af(H(Le.l(Pb(L,Th),Pb(L,e),R([function(){var a=af(H(Le.b(Pb(L,ki),Pb(L,zj))));return Pb(L,a)}()])))),ah,a,wi,l,zl,m],null)],null):w(function(){var b=w(f)?f:g;return w(b)?!((w(f)?f:0)<=Je(w(g)?g+1:f,a)&&Je(w(g)?g+1:f,a)<=(w(g)?g:9007199254740991)):b}())?new W(null,1,5,X,[new v(null,5,[rh,k,Zh,af(H(Le.l(Pb(L,ck),Pb(L,w(f)?f:0),R([function(){var a=
af(H(Le.b(Pb(L,ki),Pb(L,zj))));return Pb(L,a)}(),Pb(L,w(g)?g:9007199254740991)])))),ah,a,wi,l,zl,m],null)],null):w(w(d)?!Ld(a)&&Ab(Se(be,a)):d)?new W(null,1,5,X,[new v(null,5,[rh,k,Zh,Fk,ah,a,wi,l,zl,m],null)],null):null}
function sn(a,b,c,d){var e=null!=c&&(c.h&64||r===c.Z)?Se(ug,c):c,f=G.b(e,Ik),g=G.b(e,si),k=G.f(e,Lh,20),l=G.b(e,tj),m=G.b(e,Wi),n=G.b(e,Al),p=G.b(e,Cj),u=G.b(e,Kk),t=G.b(e,Jh),z=G.b(e,lk),x=G.b(e,hk),y=G.b(e,kk),D=G.b(e,ol),I=new bh(function(){return function(){return an.a(b)}}(t,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),null),N=function(a,b){return function(a){return kn(ec(b),a)}}(t,I,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),S=function(){return w(u)?u:function(){return function(a){return a}}(u,t,I,N,c,e,e,f,g,k,
l,m,n,p,u,t,z,x,y,D)}(),da=function(){return function(a,b,c,d){return Cd.b(a,d)}}(t,I,N,S,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),J=function(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N){return function(ea){return Sd(ea)&&(Ab(a)||Sd(a))?new W(null,3,5,X,[me,function(){return function(a,b,c,d){return c===d?a:Gd.f(a,b,d)}}(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N),me],null):w(function(){var b=Qd(ea);return b?(b=w(J)?Ab(a):J,w(b)?b:Qd(a)):b}())?new W(null,3,5,X,[w(y)?Ed:me,function(a,b,c,d,e,f,g,k,l,m,n,p,y){return function(a,
b,c,d){return c===d&&Ab(y)?a:Gd.f(a,qd(w(y)?d:c,0),qd(d,1))}}(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N),me],null):se(a)||Zd(a)||Ab(a)&&(se(ea)||Zd(ea))?new W(null,3,5,X,[Ed,e,ue],null):new W(null,3,5,X,[function(a){return function(b){return Ed(w(a)?a:b)}}(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N),e,me],null)}}(t,I,N,S,da,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D);"undefined"===typeof Im&&(Im=function(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N,S,da,wf,yi){this.form=a;this.Gc=b;this.Kb=c;this.ra=d;this.md=e;
this.oa=f;this.sd=g;this.Tb=k;this.jd=l;this.Dc=m;this.Oc=n;this.Jb=p;this.kd=y;this.Cc=t;this.Ab=x;this.Yb=u;this.ld=z;this.Kd=D;this.count=I;this.Hc=J;this.Ic=N;this.kind=S;this.ec=da;this.hd=wf;this.Bd=yi;this.h=393216;this.s=0},Im.prototype.I=function(){return function(a,b){return new Im(this.form,this.Gc,this.Kb,this.ra,this.md,this.oa,this.sd,this.Tb,this.jd,this.Dc,this.Oc,this.Jb,this.kd,this.Cc,this.Ab,this.Yb,this.ld,this.Kd,this.count,this.Hc,this.Ic,this.kind,this.ec,this.hd,b)}}(t,I,
N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.G=function(){return function(){return this.Bd}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.Da=function(){return function(){return this}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.Ea=function(){return function(){return this}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.mb=r,Im.prototype.eb=function(){return function(a,b){var c=ec(this.Ab);if(Ab(this.Tb.a?this.Tb.a(b):this.Tb.call(null,b)))return Mj;
if(w(this.ec)){var d=this.Jb.a?this.Jb.a(b):this.Jb.call(null,b);var e=T(d,0);var f=T(d,1);d=T(d,2);var g=e.a?e.a(b):e.call(null,b);e=0;var k=H(b);var l=H(k);K(l);for(M(l);;){var m=k;l=H(m);k=K(l);var n=M(l);l=k;k=n;if(m){m=Lm(c,l);if(w(bn(m)))return Mj;g=f.w?f.w(g,e,l,m):f.call(null,g,e,l,m);e+=1}else return d.a?d.a(g):d.call(null,g)}}else if(pd(b))for(f=oe(Q(b)/101),f=1>f?1:f,e=0;;){if(e>=Q(b))return b;if(w(kn(c,qd(b,e))))e+=f;else return Mj}else for(e=0,f=H(b),d=H(f),K(d),M(d);;){g=H(f);d=K(g);
g=M(g);l=d;k=g;m=f;if(null==m||O.b(e,101))return b;if(w(kn(c,l)))f=k,e+=1;else return Mj}}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.fb=function(a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N,S){return function(da,ea,ca,oa,qa){var Y=this,ta=this,ua=rn(qa,Y.kind,Y.Dc,Y.Cc,Y.count,Y.Hc,Y.Gc,ea,ca,oa);return w(ua)?ua:Se(Le,function(){var da=gf(me,Z.f(function(){return function(a,b){var c=Y.Yb.b?Y.Yb.b(a,b):Y.Yb.call(null,a,b);return w(Y.Kb.a?Y.Kb.a(b):Y.Kb.call(null,b))?null:ln(Y.form,Y.oa,
ea,ca,Cd.b(oa,c),b)}}(ua,ta,a,b,c,d,e,f,g,k,l,m,n,p,y,t,x,u,z,D,I,J,N,S),new Eg(null,0,Number.MAX_VALUE,1,null),qa)),pa=w(Y.ec)?me:ff(mf,20);return pa.a?pa.a(da):pa.call(null,da)}())}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.prototype.gb=function(){return function(a,b){return sn(this.form,this.oa,this.Ic,b)}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.Ga=function(){return function(){return new W(null,25,5,X,[mh,nh,ei,Li,Oi,nj,rj,yj,Ij,Pj,Rj,Tj,gk,uk,Ck,Jk,Mk,Nk,el,hl,il,jl,nl,Bl,El],
null)}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D),Im.va=!0,Im.pa="cljs.spec.alpha/t_cljs$spec$alpha38988",Im.ya=function(){return function(a,b){return wc(b,"cljs.spec.alpha/t_cljs$spec$alpha38988")}}(t,I,N,S,da,J,c,e,e,f,g,k,l,m,n,p,u,t,z,x,y,D));return new Im(a,f,N,d,k,b,e,l,m,g,da,J,n,p,I,S,t,c,z,x,e,y,D,t,$e)}function tn(a){return new v(null,2,[ej,hi,Ah,a],null)}function un(a){a=null!=a&&(a.h&64||r===a.Z)?Se(ug,a):a;a=G.b(a,ej);return O.b(hi,a)}
var vn=function vn(b){var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b,d=G.b(c,ul);b=H(d);var e=K(b);b=M(b);var f=G.b(c,ii),g=H(f),k=K(g);g=M(g);var l=G.b(c,rl),m=H(l);K(m);m=M(m);var n=G.b(c,Ah);c=G.b(c,Qh);return bf(me,d)?w(un(e))?(d=Ah.a(e),d=Cd.b(n,w(f)?Hd([k,d]):d),b?(b=new v(null,4,[ul,b,ii,g,rl,m,Ah,d],null),vn.a?vn.a(b):vn.call(null,b)):tn(d)):new v(null,6,[ej,Fl,ul,d,Ah,n,ii,f,rl,l,Qh,c],null):null};
function wn(a,b,c,d,e){return w(a)?(d=new v(null,5,[ej,Yh,zh,b,di,d,rl,e,fk,lh()],null),w(un(a))?Gd.l(d,uj,b,R([Ah,Cd.b(c,Ah.a(a))])):Gd.l(d,uj,a,R([Ah,c]))):null}
function xn(a,b,c,d){return w(w(b)?b:c)?(a=pf(function(a){a=K(a);return d.a?d.a(a):d.call(null,a)},Z.w(Jf,a,function(){var a=H(b);return a?a:nf(null)}(),function(){var a=H(c);return a?a:nf(null)}())),new W(null,3,5,X,[H(Z.b(K,a)),w(b)?H(Z.b(Ad,a)):null,w(c)?H(Z.b(function(){return function(a){return qd(a,2)}}(a),a)):null],null)):new W(null,3,5,X,[H(pf(d,a)),b,c],null)}
function yn(a,b,c){var d=xn(a,b,c,me);b=T(d,0);c=H(b);a=K(c);c=M(c);var e=T(d,1),f=T(e,0);d=T(d,2);return w(b)?(b=new v(null,4,[ej,pl,ul,b,ii,e,rl,d],null),null==c?w(f)?w(un(a))?tn(on(new W(null,2,5,X,[f,Ah.a(a)],null))):b:a:b):null}function zn(a,b){return w(w(a)?b:a)?yn(R([a,b]),null,null):w(a)?a:b}function An(a,b){var c=O.b(b,tl);if(c)return c;c=ej.a(Qm(a));var d=new Ag(null,new v(null,2,[Yh,null,Fl,null],null),null);c=d.a?d.a(c):d.call(null,c);c=w(c)?Ld(b):c;return w(c)?c:null}
var Bn=function Bn(b){b=Qm(b);var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b;var d=G.b(c,ej);b=G.b(c,ul);var e=G.b(c,uj),f=G.b(c,zh);c=G.b(c,rl);if(O.b(hi,d))return!0;if(O.b(null,d))return null;if(O.b(ek,d)){d=Bn.a?Bn.a(e):Bn.call(null,e);if(w(d)){d=An(e,Cn.a?Cn.a(e):Cn.call(null,e));if(w(d))return d;b=pn(Cn.a?Cn.a(e):Cn.call(null,e),b,M(c));return Ab(bn(b))}return d}if(O.b(Yh,d))return(d=e===f)?d:Bn.a?Bn.a(e):Bn.call(null,e);if(O.b(Fl,d))return bf(Bn,b);if(O.b(pl,d))return cf(Bn,b);throw Error([C.a("No matching clause: "),
C.a(d)].join(""));},Cn=function Cn(b){b=Qm(b);var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b;b=G.b(c,ul);var d=H(b),e=K(d);M(d);var f=G.b(c,ii),g=T(f,0),k=G.b(c,ej);d=G.b(c,uj);var l=G.b(c,Ah);c=G.b(c,rl);if(O.b(hi,k))return l;if(O.b(null,k))return null;if(O.b(ek,k))return e=Cn.a?Cn.a(d):Cn.call(null,d),w(An(d,e))?tl:pn(e,b,c);if(O.b(Yh,k))return Dn.f?Dn.f(d,l,g):Dn.call(null,d,l,g);if(O.b(Fl,k))return Dn.f?Dn.f(e,l,g):Dn.call(null,e,l,g);if(O.b(pl,k))return e=xn(b,f,c,Bn),b=T(e,0),b=T(b,0),e=T(e,1),
e=T(e,0),b=null==b?tl:Cn.a?Cn.a(b):Cn.call(null,b),w(e)?on(new W(null,2,5,X,[e,b],null)):b;throw Error([C.a("No matching clause: "),C.a(k)].join(""));};
function Dn(a,b,c){var d=Qm(a);a=null!=d&&(d.h&64||r===d.Z)?Se(ug,d):d;var e=G.b(a,ej),f=G.b(a,ul),g=G.b(a,di);d=function(a,d,e,f,g,u){return function(){var a=Cn(e);if(Ld(a))return b;a=w(c)?Hd([c,a]):a;var d=w(u)?rf:Cd;return d.b?d.b(b,a):d.call(null,b,a)}}(d,a,a,e,f,g);if(O.b(null,e))return b;if(O.b(pl,e)||O.b(hi,e)||O.b(ek,e))return a=Cn(a),O.b(a,tl)?b:Cd.b(b,w(c)?Hd([c,a]):a);if(O.b(Yh,e)||O.b(Fl,e))return d();throw Error([C.a("No matching clause: "),C.a(e)].join(""));}
var En=function En(b,c){var d=Qm(b),e=null!=d&&(d.h&64||r===d.Z)?Se(ug,d):d;var f=G.b(e,ul);var g=H(f),k=K(g),l=M(g),m=G.b(e,ii),n=H(m),p=K(n),u=M(n),t=G.b(e,ej),z=G.b(e,uj),x=G.b(e,zh),y=G.b(e,Ah),D=G.b(e,di),I=G.b(e,rl);if(w(e)){if(O.b(hi,t))return null;if(O.b(null,t))return f=jn(e,c,e,null),w(bn(f))?null:tn(f);if(O.b(ek,t))return d=En.b?En.b(z,c):En.call(null,z,c),w(d)?O.b(hi,ej.a(d))?(f=pn(Cn(d),f,M(I)),w(bn(f))?null:tn(f)):new v(null,4,[ej,ek,uj,d,ul,f,rl,I],null):null;if(O.b(Fl,t))return zn(vn(new v(null,
4,[ul,xd(En.b?En.b(k,c):En.call(null,k,c),l),ii,m,rl,I,Ah,y],null)),w(Bn(k))?function(){var b=vn(new v(null,4,[ul,l,ii,u,rl,M(I),Ah,Dn(k,y,p)],null));return En.b?En.b(b,c):En.call(null,b,c)}():null);if(O.b(pl,t))return yn(Z.b(function(){return function(b){return En.b?En.b(b,c):En.call(null,b,c)}}(t,d,e,e,f,g,k,l,k,l,f,m,n,p,u,p,u,m,t,z,x,y,D,I),f),m,I);if(O.b(Yh,t))return zn(wn(En.b?En.b(z,c):En.call(null,z,c),x,y,D,I),w(Bn(z))?function(){var b=wn(x,x,Dn(z,y,null),D,I);return En.b?En.b(b,c):En.call(null,
b,c)}():null);throw Error([C.a("No matching clause: "),C.a(t)].join(""));}return null},Fn=function Fn(b){b=Qm(b);var c=null!=b&&(b.h&64||r===b.Z)?Se(ug,b):b,d=G.b(c,ej);G.b(c,ul);var e=G.b(c,ii);b=G.b(c,rl);var f=G.b(c,di),g=G.b(c,uj),k=G.b(c,Qh),l=G.b(c,ti);if(w(c)){if(O.b(hi,d))return null;if(O.b(null,d))return c;if(O.b(ek,d))return c=Fn.a?Fn.a(g):Fn.call(null,g),xd(Cl,xd(c,b));if(O.b(Fl,d))return w(k)?b=Pb(Pb(L,k),yh):(c=H(e),b=xd(qi,of(Jf,R([c?c:nf(ri),b])))),b;if(O.b(pl,d))return w(l)?Pb(Pb(L,
l),Kl):xd(Ph,of(Jf,R([e,b])));if(O.b(Yh,d))return c=w(f)?yh:ph,Pb(Pb(L,b),c);throw Error([C.a("No matching clause: "),C.a(d)].join(""));}return null},Gn=function Gn(b,c,d,e,f,g){var k=T(g,0),l=Qm(c),m=null!=l&&(l.h&64||r===l.Z)?Se(ug,l):l,n=G.b(m,ej),p=G.b(m,ul),u=G.b(m,ii),t=G.b(m,rl),z=G.b(m,di),x=G.b(m,uj),y=G.b(m,zh);c=function(){var b=Um(m);return w(b)?Cd.b(e,b):e}();var D=function(b,c,d,e,g,k,l,m,n,p,y,t,x,u){return function(b,c){return new W(null,1,5,X,[new v(null,6,[rh,b,Lj,"Insufficient input",
Zh,c,ah,L,wi,u,zl,f],null)],null)}}(g,k,g,l,m,m,n,p,u,t,z,x,y,c);if(w(m)){if(O.b(hi,n))return null;if(O.b(null,n))return Ld(g)?D(d,b):ln(b,m,d,c,f,k);if(O.b(ek,n)){if(Ld(g))return w(Bn(x))?qn(t,p,d,c,f,Cn(x)):D(d,Fn(x));D=En(x,k);if(w(D))return qn(t,p,d,c,f,Cn(D));D=Fn(x);return Gn.ga?Gn.ga(D,x,d,c,f,g):Gn.call(null,D,x,d,c,f,g)}if(O.b(Fl,n))return b=Z.w(Jf,p,function(){var b=H(u);return b?b:nf(null)}(),function(){var b=H(t);return b?b:nf(null)}()),p=O.b(1,Q(b))?K(b):K(qf(function(){return function(b){b=
T(b,0);return Bn(b)}}(b,n,g,k,g,l,m,m,n,p,u,t,z,x,y,c,D),b)),x=T(p,0),k=T(p,1),p=T(p,2),k=w(k)?Cd.b(d,k):d,p=w(p)?p:Fn(x),Ld(g)&&Ab(x)?D(k,p):Gn.ga?Gn.ga(p,x,k,c,f,g):Gn.call(null,p,x,k,c,f,g);if(O.b(pl,n))return Ld(g)?D(d,Fn(m)):Se(Le,Z.w(function(b,c,e,g,k,l,m,n,p,y,t,u,x,z,D){return function(b,c,e){c=w(c)?c:Fn(e);b=w(b)?Cd.b(d,b):d;return Gn.ga?Gn.ga(c,e,b,D,f,g):Gn.call(null,c,e,b,D,f,g)}}(n,g,k,g,l,m,m,n,p,u,t,z,x,y,c,D),function(){var b=H(u);return b?b:nf(null)}(),function(){var b=H(t);return b?
b:nf(null)}(),p));if(O.b(Yh,n))return D=x===y?t:Fn(x),Gn.ga?Gn.ga(D,x,d,c,f,g):Gn.call(null,D,x,d,c,f,g);throw Error([C.a("No matching clause: "),C.a(n)].join(""));}return null};function Hn(a,b){for(;;){var c=b,d=H(c),e=K(d);d=M(d);if(Ld(c))return w(Bn(a))?(c=Cn(a),O.b(c,tl)?null:c):Mj;c=En(a,e);if(w(c))e=d,a=c,b=e;else return Mj}}
var Wm=function Wm(b,c){"undefined"===typeof Jm&&(Jm=function(b,c,f){this.yb=b;this.ra=c;this.Cd=f;this.h=393216;this.s=0},Jm.prototype.I=function(b,c){return new Jm(this.yb,this.ra,c)},Jm.prototype.G=function(){return this.Cd},Jm.prototype.Da=function(){return this},Jm.prototype.Ea=function(){return this},Jm.prototype.mb=r,Jm.prototype.eb=function(b,c){return null==c||Md(c)?Hn(this.yb,H(c)):Mj},Jm.prototype.fb=function(b,c,f,g,k){if(null==k||Md(k))a:{b=this.yb;var d=H(k);k=H(d);K(k);M(k);k=b;var e=
d;for(d=0;;){var n=H(e),p=K(n);n=M(n);if(Ld(e)){c=w(Bn(k))?null:Gn(Fn(k),k,c,f,g,null);break a}p=En(k,p);if(w(p))e=n,d+=1,k=p;else{if(w(un(k))){c=O.b(ej.a(k),Fl)?Gn(Fn(k),k,c,f,Cd.b(g,d),H(e)):new W(null,1,5,X,[new v(null,6,[rh,c,Lj,"Extra input",Zh,Fn(b),ah,e,wi,f,zl,Cd.b(g,d)],null)],null);break a}b=Gn(Fn(k),k,c,f,Cd.b(g,d),H(e));c=w(b)?b:new W(null,1,5,X,[new v(null,6,[rh,c,Lj,"Extra input",Zh,Fn(k),ah,e,wi,f,zl,Cd.b(g,d)],null)],null);break a}}}else c=new W(null,1,5,X,[new v(null,5,[rh,c,Zh,Fn(this.yb),
ah,k,wi,f,zl,g],null)],null);return c},Jm.prototype.gb=function(b,c){return Wm.b?Wm.b(this.yb,c):Wm.call(null,this.yb,c)},Jm.Ga=function(){return new W(null,3,5,X,[Hj,Li,hj],null)},Jm.va=!0,Jm.pa="cljs.spec.alpha/t_cljs$spec$alpha39682",Jm.ya=function(b,c){return wc(c,"cljs.spec.alpha/t_cljs$spec$alpha39682")});return new Jm(b,c,$e)};
hn(Bj,U(yl,U(Zj,new W(null,1,5,X,[$i],null),U(vj,U(Aj,rk,$i),U(Aj,jj,$i))),U(Zj,new W(null,1,5,X,[oj],null),U(Aj,U(tk,new W(null,1,5,X,[new W(null,2,5,X,[ok,Ri],null)],null),new v(null,2,[rk,ok,jj,Ri],null)),oj))),nn(U(yl,U(tk,new W(null,1,5,X,[zj],null),U(vj,U(Aj,rk,zj),U(Aj,jj,zj))),U(tk,new W(null,1,5,X,[zj],null),U(Aj,U(tk,new W(null,1,5,X,[new W(null,2,5,X,[ok,Ri],null)],null),new v(null,2,[rk,ok,jj,Ri],null)),zj))),function(a){return Cg(Z.b(rk,a),Z.b(jj,a))},null,!0,function(a){return Z.b(function(a){var b=
T(a,0);a=T(a,1);return new v(null,2,[rk,b,jj,a],null)},a)}));if("undefined"===typeof In)var In=!1;if("undefined"===typeof Jn)var Jn=!1;function Kn(a,b){if(w(kn(a,b)))return b;var c=yg.l(R([Gd.f(en(a,b),oh,Yj)]));throw Error([C.a("Spec assertion failed\n"),C.a(function(){var a=new mb,b=qb,f=ob;qb=!0;ob=function(a,b,c){return function(a){return c.append(a)}}(b,f,a,c);try{gn(c)}finally{ob=f,qb=b}return""+C.a(a)}())].join(""));};Jn=!0;qb=!1;pb=ob=function(){function a(a){var c=null;if(0<arguments.length){c=0;for(var e=Array(arguments.length-0);c<e.length;)e[c]=arguments[c+0],++c;c=new ad(e,0,null)}return b.call(this,c)}function b(a){return tableau.log(Se(C,a))}a.B=0;a.F=function(a){a=H(a);return b(a)};a.l=b;return a}();
hn(Gh,U(li,Ii,U(Zj,new W(null,1,5,X,[Di],null),U(bi,/\w+/,Di))),function Ln(b,c,d){var e=new bh(function(){return rf.b(Dd,Z.f(an,c,b))},null),f=function(){var b=Q(c);switch(b){case 2:return function(b,c){return function(b){var d=ec(c);b=Lm(d.a?d.a(0):d.call(null,0),b);return w(bn(b))?Mj:Lm(d.a?d.a(1):d.call(null,1),b)}}(b,e);case 3:return function(b,c){return function(b){var d=ec(c);b=Lm(d.a?d.a(0):d.call(null,0),b);if(w(bn(b)))return Mj;b=Lm(d.a?d.a(1):d.call(null,1),b);return w(bn(b))?Mj:Lm(d.a?
d.a(2):d.call(null,2),b)}}(b,e);default:return function(b,c){return function(b){for(var d=ec(c),e=0;;)if(e<Q(d)){b=Lm(d.a?d.a(e):d.call(null,e),b);if(w(bn(b)))return Mj;e+=1}else return b}}(b,e)}}();"undefined"===typeof Hm&&(Hm=function(b,c,d,e,f,p){this.forms=b;this.Za=c;this.ra=d;this.hc=e;this.Ja=f;this.Ad=p;this.h=393216;this.s=0},Hm.prototype.I=function(){return function(b,c){return new Hm(this.forms,this.Za,this.ra,this.hc,this.Ja,c)}}(e,f),Hm.prototype.G=function(){return function(){return this.Ad}}(e,
f),Hm.prototype.Da=function(){return function(){return this}}(e,f),Hm.prototype.Ea=function(){return function(){return this}}(e,f),Hm.prototype.mb=r,Hm.prototype.eb=function(){return function(b,c){return this.Ja.a?this.Ja.a(c):this.Ja.call(null,c)}}(e,f),Hm.prototype.fb=function(){return function(b,c,d,e,f){return qn(this.forms,this.Za,c,d,e,f)}}(e,f),Hm.prototype.gb=function(){return function(b,c){return Ln.f?Ln.f(this.forms,this.Za,c):Ln.call(null,this.forms,this.Za,c)}}(e,f),Hm.Ga=function(){return function(){return new W(null,
6,5,X,[fi,Nj,Li,Wk,kl,Mh],null)}}(e,f),Hm.va=!0,Hm.pa="cljs.spec.alpha/t_cljs$spec$alpha38742",Hm.ya=function(){return function(b,c){return wc(c,"cljs.spec.alpha/t_cljs$spec$alpha38742")}}(e,f));return new Hm(b,c,d,e,f,$e)}(new W(null,2,5,X,[Ii,U(tk,new W(null,1,5,X,[zj],null),U(bi,/\w+/,zj))],null),new W(null,2,5,X,[Bb,function(a){return Gg(/\w+/,a)}],null),null));hn(Dj,Ii,Bb);hn(Ch,Ii,Bb);
hn(Xj,U(Ki,jk,mk,xj,new Ag(null,new v(null,1,["",null],null),null),dj,Gh),function Mn(b,c,d,e){var f=lh(),g=Cg(b,d),k=new bh(function(){return function(){return rf.b(Dd,Z.f(an,d,c))}}(f,g),null),l=function(){var c=Q(d);switch(c){case 2:return function(c,d,e,f){return function(c){var d=ec(f),e=Lm(d.a?d.a(0):d.call(null,0),c);return w(bn(e))?(c=Lm(d.a?d.a(1):d.call(null,1),c),w(bn(c))?Mj:on(new W(null,2,5,X,[b.a?b.a(1):b.call(null,1),c],null))):on(new W(null,2,5,X,[b.a?b.a(0):b.call(null,0),e],null))}}(c,
f,g,k);case 3:return function(c,d,e,f){return function(c){var d=ec(f),e=Lm(d.a?d.a(0):d.call(null,0),c);return w(bn(e))?(e=Lm(d.a?d.a(1):d.call(null,1),c),w(bn(e))?(c=Lm(d.a?d.a(2):d.call(null,2),c),w(bn(c))?Mj:on(new W(null,2,5,X,[b.a?b.a(2):b.call(null,2),c],null))):on(new W(null,2,5,X,[b.a?b.a(1):b.call(null,1),e],null))):on(new W(null,2,5,X,[b.a?b.a(0):b.call(null,0),e],null))}}(c,f,g,k);default:return function(c,d,e,f){return function(c){for(var d=ec(f),e=0;;)if(e<Q(d)){var g=d.a?d.a(e):d.call(null,
e);g=Lm(g,c);if(w(bn(g)))e+=1;else return on(new W(null,2,5,X,[b.a?b.a(e):b.call(null,e),g],null))}else return Mj}}(c,f,g,k)}}();"undefined"===typeof Gm&&(Gm=function(b,c,d,e,f,g,k,l,D){this.keys=b;this.forms=c;this.Za=d;this.ra=e;this.id=f;this.qd=g;this.hc=k;this.Ja=l;this.zd=D;this.h=393216;this.s=0},Gm.prototype.I=function(){return function(b,c){return new Gm(this.keys,this.forms,this.Za,this.ra,this.id,this.qd,this.hc,this.Ja,c)}}(f,g,k,l),Gm.prototype.G=function(){return function(){return this.zd}}(f,
g,k,l),Gm.prototype.Da=function(){return function(){return this}}(f,g,k,l),Gm.prototype.Ea=function(){return function(){return this}}(f,g,k,l),Gm.prototype.mb=r,Gm.prototype.eb=function(){return function(b,c){return this.Ja.a?this.Ja.a(c):this.Ja.call(null,c)}}(f,g,k,l),Gm.prototype.fb=function(b,c,d,e){return function(f,g,k,l,m){return w(Ab(bn(jn(this,m,Bh,null))))?null:Se(Le,Z.w(function(){return function(b,c,d){return w(Ab(bn(jn(d,m,Bh,null))))?null:ln(c,d,Cd.b(g,b),k,l,m)}}(this,b,c,d,e),this.keys,
this.forms,this.Za))}}(f,g,k,l),Gm.prototype.gb=function(){return function(b,c){return Mn.w?Mn.w(this.keys,this.forms,this.Za,c):Mn.call(null,this.keys,this.forms,this.Za,c)}}(f,g,k,l),Gm.Ga=function(){return function(){return new W(null,9,5,X,[Ek,fi,Nj,Li,Uk,Kj,Wk,kl,ai],null)}}(f,g,k,l),Gm.va=!0,Gm.pa="cljs.spec.alpha/t_cljs$spec$alpha38570",Gm.ya=function(){return function(b,c){return wc(c,"cljs.spec.alpha/t_cljs$spec$alpha38570")}}(f,g,k,l));return new Gm(b,c,d,e,f,g,k,l,$e)}(new W(null,3,5,X,
[jk,xj,dj],null),new W(null,3,5,X,[mk,new Ag(null,new v(null,1,["",null],null),null),Gh],null),new W(null,3,5,X,[function(a){return null==a},new Ag(null,new v(null,1,["",null],null),null),Gh],null),null));hn(xl,uh,Xd);hn(Gk,uh,Xd);hn(Xh,new Ag(null,new v(null,6,["float",null,"int",null,"string",null,"bool",null,"datetime",null,"date",null],null),null),new Ag(null,new v(null,6,["float",null,"int",null,"string",null,"bool",null,"datetime",null,"date",null],null),null));
hn(ji,new Ag(null,new v(null,5,["sum",null,"count",null,"avg",null,"count_dist",null,"median",null],null),null),new Ag(null,new v(null,5,["sum",null,"count",null,"avg",null,"count_dist",null,"median",null],null),null));hn(Uj,new Ag(null,new v(null,2,["measure",null,"dimension",null],null),null),new Ag(null,new v(null,2,["measure",null,"dimension",null],null),null));
hn(Il,new Ag(null,new v(null,2,["discrete",null,"continuous",null],null),null),new Ag(null,new v(null,2,["discrete",null,"continuous",null],null),null));
hn(Rh,new Ag(null,new v(null,8,["zip_code_postcode",null,"congressional_district",null,"city",null,"county",null,"state_province",null,"area_code",null,"cbsa_msa",null,"country_region",null],null),null),new Ag(null,new v(null,8,["zip_code_postcode",null,"congressional_district",null,"city",null,"county",null,"state_province",null,"area_code",null,"cbsa_msa",null,"country_region",null],null),null));
hn(Sk,new Ag(null,new v(null,4,["percentage",null,"currency",null,"number",null,"scientific",null],null),null),new Ag(null,new v(null,4,["percentage",null,"currency",null,"number",null,"scientific",null],null),null));hn(Vk,new Ag(null,new v(null,4,["thousands",null,"billions_standard",null,"billions_english",null,"millions",null],null),null),new Ag(null,new v(null,4,["thousands",null,"billions_standard",null,"billions_english",null,"millions",null],null),null));
hn(Oh,U(Gj,sh,new W(null,2,5,X,[Jj,Ll],null)),mn(sg([sh,th,Eh,Ih,Kh,Uh,Ji,Qj,nk,wk,zk,Dl],[new W(null,2,5,X,[Jj,Ll],null),null,null,new W(null,3,5,X,[function(a){return Qd(a)},function(a){return ae(a,Nh)},function(a){return ae(a,Hi)}],null),function(a){return Qd(a)&&ae(a,Nh)&&ae(a,Hi)},Dd,new W(null,2,5,X,[Jj,Ll],null),null,new W(null,2,5,X,[Nh,Hi],null),Dd,new W(null,3,5,X,[U(tk,new W(null,1,5,X,[zj],null),U(sj,zj)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,Nh)),U(tk,new W(null,1,5,X,[zj],null),U(qj,
zj,Hi))],null),null])));
hn(Dk,U(Gj,sh,new W(null,2,5,X,[Xh,Gh],null),th,new W(null,10,5,X,[ji,Dj,Uj,Il,Ch,Rh,Sk,Vk,Gk,Oh],null)),mn(sg([sh,th,Eh,Ih,Kh,Uh,Ji,Qj,nk,wk,zk,Dl],[new W(null,2,5,X,[Xh,Gh],null),new W(null,10,5,X,[ji,Dj,Uj,Il,Ch,Rh,Sk,Vk,Gk,Oh],null),null,new W(null,3,5,X,[function(a){return Qd(a)},function(a){return ae(a,bk)},function(a){return ae(a,fk)}],null),function(a){return Qd(a)&&ae(a,bk)&&ae(a,fk)},new W(null,10,5,X,[mj,Sj,Sh,Gi,qh,xk,Ej,pj,cj,ql],null),new W(null,2,5,X,[Xh,Gh],null),null,new W(null,2,
5,X,[bk,fk],null),new W(null,10,5,X,[ji,Dj,Uj,Il,Ch,Rh,Sk,Vk,Gk,Oh],null),new W(null,3,5,X,[U(tk,new W(null,1,5,X,[zj],null),U(sj,zj)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,bk)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,fk))],null),null])));hn(Pi,U(pi,Dk),sn(Dk,Dk,new v(null,4,[si,null,tj,function(a){return Md(a)},ol,!0,Al,U(pi,Dk)],null),null));
hn(yk,U(Gj,sh,new W(null,2,5,X,[Pi,Gh],null),th,new W(null,4,5,X,[Dj,Ch,Xj,xl],null)),mn(sg([sh,th,Eh,Ih,Kh,Uh,Ji,Qj,nk,wk,zk,Dl],[new W(null,2,5,X,[Pi,Gh],null),new W(null,4,5,X,[Dj,Ch,Xj,xl],null),null,new W(null,3,5,X,[function(a){return Qd(a)},function(a){return ae(a,Fi)},function(a){return ae(a,fk)}],null),function(a){return Qd(a)&&ae(a,Fi)&&ae(a,fk)},new W(null,4,5,X,[Sj,qh,xh,wh],null),new W(null,2,5,X,[Pi,Gh],null),null,new W(null,2,5,X,[Fi,fk],null),new W(null,4,5,X,[Dj,Ch,Xj,xl],null),new W(null,
3,5,X,[U(tk,new W(null,1,5,X,[zj],null),U(sj,zj)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,Fi)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,fk))],null),null])));hn(vi,U(pi,yk),sn(yk,yk,new v(null,4,[si,null,tj,function(a){return Md(a)},ol,!0,Al,U(pi,yk)],null),null));
hn(Hk,U(Gj,sh,new W(null,3,5,X,[Dj,Pk,$h],null)),mn(sg([sh,th,Eh,Ih,Kh,Uh,Ji,Qj,nk,wk,zk,Dl],[new W(null,3,5,X,[Dj,Pk,$h],null),null,null,new W(null,4,5,X,[function(a){return Qd(a)},function(a){return ae(a,Sj)},function(a){return ae(a,lj)},function(a){return ae(a,Yi)}],null),function(a){return Qd(a)&&ae(a,Sj)&&ae(a,lj)&&ae(a,Yi)},Dd,new W(null,3,5,X,[Dj,Pk,$h],null),null,new W(null,3,5,X,[Sj,lj,Yi],null),Dd,new W(null,4,5,X,[U(tk,new W(null,1,5,X,[zj],null),U(sj,zj)),U(tk,new W(null,1,5,X,[zj],null),
U(qj,zj,Sj)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,lj)),U(tk,new W(null,1,5,X,[zj],null),U(qj,zj,Yi))],null),null])));hn(Wj,U(pi,Hk),sn(Hk,Hk,new v(null,4,[si,null,tj,function(a){return Md(a)},ol,!0,Al,U(pi,Hk)],null),null));
hn(Rk,U(fj,new Ag(null,new v(null,3,["gatherData",null,"interactive",null,"auth",null],null),null)),function Nn(b,c,d){var e=an.b(c,b);"undefined"===typeof Km&&(Km=function(b,c,d,e,m){this.form=b;this.oa=c;this.ra=d;this.Ab=e;this.Dd=m;this.h=393216;this.s=0},Km.prototype.I=function(){return function(b,c){return new Km(this.form,this.oa,this.ra,this.Ab,c)}}(e),Km.prototype.G=function(){return function(){return this.Dd}}(e),Km.prototype.Da=function(){return function(){return this}}(e),Km.prototype.Ea=
function(){return function(){return this}}(e),Km.prototype.mb=r,Km.prototype.eb=function(){return function(b,c){return null==c?null:Lm(this.Ab,c)}}(e),Km.prototype.fb=function(){return function(b,c,d,e,m){b=Ab(bn(jn(this.Ab,m,Bh,null)));return w(w(b)?b:null==m)?null:Cd.b(ln(this.form,this.oa,Cd.b(c,sl),d,e,m),new v(null,5,[rh,Cd.b(c,tl),Zh,Vj,ah,m,wi,d,zl,e],null))}}(e),Km.prototype.gb=function(){return function(b,c){return Nn.f?Nn.f(this.form,this.oa,c):Nn.call(null,this.form,this.oa,c)}}(e),Km.Ga=
function(){return function(){return new W(null,5,5,X,[mh,nj,Li,Ck,Lk],null)}}(e),Km.va=!0,Km.pa="cljs.spec.alpha/t_cljs$spec$alpha39836",Km.ya=function(){return function(b,c){return wc(c,"cljs.spec.alpha/t_cljs$spec$alpha39836")}}(e));return new Km(b,c,d,e,$e)}(new Ag(null,new v(null,3,["gatherData",null,"interactive",null,"auth",null],null),null),new Ag(null,new v(null,3,["gatherData",null,"interactive",null,"auth",null],null),null),null));
hn(qk,new Ag(null,new v(null,3,["none",null,"custom",null,"basic",null],null),null),new Ag(null,new v(null,3,["none",null,"custom",null,"basic",null],null),null));
hn(wl,U(Gj,th,new W(null,3,5,X,[sk,fl,Oj],null)),mn(sg([sh,th,Eh,Ih,Kh,Uh,Ji,Qj,nk,wk,zk,Dl],[null,new W(null,3,5,X,[sk,fl,Oj],null),null,new W(null,1,5,X,[function(a){return Qd(a)}],null),function(a){return Qd(a)},new W(null,3,5,X,[Ei,Ui,oi],null),Dd,null,Dd,new W(null,3,5,X,[sk,fl,Oj],null),new W(null,1,5,X,[U(tk,new W(null,1,5,X,[zj],null),U(sj,zj))],null),null])));
var On=function On(b){if(null!=b&&null!=b.fd)return"none";var c=On[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=On._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IWebDataConnector.get-auth-type",b);},Pn=function Pn(b){if(null!=b&&null!=b.gd)return"WebPlotDigitizer";var c=Pn[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Pn._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IWebDataConnector.get-name",b);},Qn=function Qn(b){if(null!=b&&null!=b.zc)return b.zc();
var c=Qn[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Qn._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IWebDataConnector.get-table-infos",b);},Rn=function Rn(b){if(null!=b&&null!=b.yc)return b.yc();var c=Rn[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Rn._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IWebDataConnector.get-standard-connections",b);},Sn=function Sn(b,c,d,e){if(null!=b&&null!=b.wc)return b.wc();var f=Sn[q(null==b?null:b)];if(null!=
f)return f.w?f.w(b,c,d,e):f.call(null,b,c,d,e);f=Sn._;if(null!=f)return f.w?f.w(b,c,d,e):f.call(null,b,c,d,e);throw B("IWebDataConnector.\x3cget-rows",b);},Tn=function Tn(b){if(null!=b&&null!=b.Bc)return b.Bc();var c=Tn[q(null==b?null:b)];if(null!=c)return c.a?c.a(b):c.call(null,b);c=Tn._;if(null!=c)return c.a?c.a(b):c.call(null,b);throw B("IWebDataConnector.shutdown",b);},Un=function Un(b,c,d){if(null!=b&&null!=b.Ac)return b.Ac(0,c,d);var e=Un[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):
e.call(null,b,c,d);e=Un._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("IWebDataConnector.init",b);},Vn=function Vn(b,c,d){if(null!=b&&null!=b.xc)return b.xc(0,0,d);var e=Vn[q(null==b?null:b)];if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);e=Vn._;if(null!=e)return e.f?e.f(b,c,d):e.call(null,b,c,d);throw B("IWebDataConnector.check-auth",b);};function Wn(a){return In?Jn?Kn(qk,On(a)):On(a):On(a)}
function Xn(a,b){Zg(R([[C.a("tab-shutdown: exiting phase: "),C.a(In?Jn?Kn(Rk,tableau.phase):tableau.phase:tableau.phase)].join("")]));var c=In?Jn?Kn(wl,Tn(a)):Tn(a):Tn(a);var d=null!=c&&(c.h&64||r===c.Z)?Se(ug,c):c;c=G.b(d,Ui);var e=G.b(d,oi);d=G.b(d,Ei);d=JSON.stringify(fh(d));tableau.connectionData=d;tableau.username=c;tableau.password=e;return b.m?b.m():b.call(null)}
function Yn(){var a=Zn;Xn(a,function(){return Zg(R(["shutdown callback"]))});tableau.connectionName=Pn.a?Pn.a(a):Pn.call(null,a);return tableau.submit()};"corsProxy"in wpd||(wpd.corsProxy="https://dtreskunov-cors-anywhere.herokuapp.com");function $n(a){a=JSON.parse(a);return w(a)?wpd.saveResume.resumeFromJSON(a):null}function ao(a,b){return wpd.graphicsWidget.loadImageFromURL(a,b)}function bo(){var a=wpd.appData.getPlotData();return Ba(a,"dataSeriesColl")}
function co(a,b){var c=a.name,d=O.b(c,"Default Dataset")?"":[C.a(c),C.a(" ")].join("");return function(){return function(a){var b=/\W+/;if("string"===typeof b)a=a.replace(new RegExp(String(b).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08"),"g"),"_");else if(b instanceof RegExp){var c=RegExp,d=b.source,e=w(b.ignoreCase)?[C.a("g"),C.a("i")].join(""):"g";e=w(b.multiline)?[C.a(e),C.a("m")].join(""):e;b=w(b.he)?[C.a(e),C.a("u")].join(""):e;c=new c(d,b);a=a.replace(c,"_")}else throw[C.a("Invalid match arg: "),
C.a(b)].join("");return a}}(c,d)([C.a(d),C.a(b)].join(""))}function eo(a){return new W(null,4,5,X,[new v(null,4,[fk,co(a,"x"),bk,"float",Sh,"dimension",Gi,"continuous"],null),new v(null,4,[fk,co(a,"y"),bk,"float",Sh,"dimension",Gi,"continuous"],null),new v(null,4,[fk,co(a,"x pixel"),bk,"int",Sh,"dimension",Gi,"continuous"],null),new v(null,4,[fk,co(a,"y pixel"),bk,"int",Sh,"dimension",Gi,"continuous"],null)],null)}function mo(){}h=mo.prototype;h.fd=function(){return"none"};
h.xc=function(a,b,c){return c.m?c.m():c.call(null)};h.yc=function(){return Dd};h.gd=function(){return"WebPlotDigitizer"};h.zc=function(){return new W(null,1,5,X,[new v(null,3,[fk,"WebPlotDigitizer",Sj,"Datasets",Fi,of(eo,R([bo()]))],null)],null)};
h.wc=function(){var a=Bm(null),b=function(){var a=wpd.appData.getPlotData().axes;if(w(a))return a;throw"Axes are not calibrated";}(),c=Ba(b,"pixelToData"),d=Bm(1);gm(function(a,b,c,d,l){return function(){var e=function(){return function(a){return function(){function b(b){for(;;){a:try{for(;;){var c=a(b);if(!xe(c,gj)){var d=c;break a}}}catch(I){if(I instanceof Object)b[5]=I,ym(b),d=gj;else throw I;}if(!xe(d,gj))return d}}function c(){var a=[null,null,null,null,null,null,null,null,null,null,null,null,
null,null,null];a[0]=d;a[1]=1;return a}var d=null;d=function(a){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,a)}throw Error("Invalid arity: "+(arguments.length-1));};d.m=c;d.a=b;return d}()}(function(a,b,c,d,e){return function(f){var g=f[1];if(7===g){var k=f[7];var l=f[8];var m=f[9];var n=f[10];f[11]=f[2];f[7]=k;f[8]=l;f[9]=m;f[10]=n+1;f[2]=null;f[1]=2;return gj}if(1===g){var p=bo();k=H(p);m=null;n=l=0;f[7]=k;f[8]=l;f[9]=m;f[10]=n;f[2]=null;f[1]=2;return gj}if(4===
g){k=f[7];l=f[8];m=f[9];n=f[10];var t=Rb.b(m,n),u=Ba(t,"getPixel"),x=Ba(t,"getCount"),y=co(t,"x"),z=co(t,"y"),ua=co(t,"x pixel"),Ja=co(t,"y pixel");p=function(){return function(a,b,c,d,e,f,g,k,l,m,n,p,t,u,x,y,z,D,I,J,N,S,ea,ca,da,Y,oa){return function(b){var c=m.a?m.a(b):m.call(null,b);b=Ba(c,"x");c=Ba(c,"y");var d=oa.b?oa.b(b,c):oa.call(null,b,c),e=T(d,0);d=T(d,1);return Hd([g,e,k,d,n,b,a,c])}}(Ja,t,x,l,m,n,y,z,k,u,ua,k,l,m,n,t,u,x,y,z,ua,Ja,g,a,b,c,d,e)}();var pa=x.m?x.m():x.call(null);p=Z.b(p,
new Eg(null,0,pa,1,null));return wm(f,7,b,p)}if(13===g)return f[2]=f[2],f[1]=10,gj;if(6===g)return f[2]=f[2],f[1]=3,gj;if(3===g)return p=f[2],pa=Nl(b),f[12]=p,xm(f,pa);if(12===g){var Y=f[13];l=f[8];m=f[9];n=f[10];var ta=K(Y),eb=Ba(ta,"getPixel"),Ya=Ba(ta,"getCount"),Ma=co(ta,"x"),Ra=co(ta,"y"),Za=co(ta,"x pixel"),Nb=co(ta,"y pixel");p=function(){return function(a,b,c,d,e,f,g,k,l,m,n,p,t,u,x,y,z,D,I,J,N,S,ea,ca,da,Y,oa,qa){return function(b){var c=n.a?n.a(b):n.call(null,b);b=Ba(c,"x");c=Ba(c,"y");
var d=qa.b?qa.b(b,c):qa.call(null,b,c),e=T(d,0);d=T(d,1);return Hd([k,e,l,d,p,b,a,c])}}(Nb,ta,Ya,l,m,n,Y,Ma,Ra,Y,eb,Za,Y,l,m,n,ta,eb,Ya,Ma,Ra,Za,Nb,g,a,b,c,d,e)}();pa=Ya.m?Ya.m():Ya.call(null);p=Z.b(p,new Eg(null,0,pa,1,null));return wm(f,14,b,p)}if(2===g)return l=f[8],n=f[10],f[1]=w(n<l)?4:5,gj;if(11===g){Y=f[13];p=Fc(Y);pa=Gc(Y);var mc=Q(p);k=pa;m=p;l=mc;n=0;f[7]=k;f[8]=l;f[9]=m;f[10]=n;f[2]=null;f[1]=2;return gj}return 9===g?(f[2]=null,f[1]=10,gj):5===g?(Y=f[13],k=f[7],p=H(k),f[13]=p,f[1]=p?8:
9,gj):14===g?(Y=f[13],p=f[2],k=M(Y),m=null,n=l=0,f[14]=p,f[7]=k,f[8]=l,f[9]=m,f[10]=n,f[2]=null,f[1]=2,gj):10===g?(f[2]=f[2],f[1]=6,gj):8===g?(Y=f[13],f[1]=Td(Y)?11:12,gj):null}}(a,b,c,d,l),a,b,c,d,l)}(),f=function(){var b=e.m?e.m():e.call(null);b[6]=a;return b}();return um(f)}}(d,a,b,c,this));return a};h.Bc=function(){return new v(null,1,[Ei,new v(null,2,[Ok,wpd.saveResume.generateJSON(),Ak,wpd.graphicsWidget.getImageDataURL("image/jpeg",.92)],null)],null)};
h.Ac=function(a,b,c){switch(b){case "auth":case "interactive":return wpd.browserInfo.checkBrowser(),wpd.layoutManager.initialLayout(),$a().style.display="none",ao(function(){var a=sf(c,new W(null,2,5,X,[Ei,Ak],null));return w(a)?a:"images/start.png"}(),function(){return function(){$n(sf(c,new W(null,2,5,X,[Ei,Ok],null)));return w(wpd.appData.isAligned())?wpd.acquireData.load():null}}(b,this));case "gatherData":return $n(sf(c,new W(null,2,5,X,[Ei,Ok],null)));default:throw Error([C.a("No matching clause: "),
C.a(b)].join(""));}};var Zn=new mo,no=Zn,oo=tableau.makeConnector();
oo.init=ff(function(a,b){var c=In?Jn?Kn(Rk,tableau.phase):tableau.phase:tableau.phase,d=new v(null,3,[Ui,tableau.username,oi,tableau.password,Ei,function(){var a=tableau.connectionData,b=null==a?null:Ve(a),d=null==b?null:function(){return function(){return function(a){return JSON.parse(a)}}(a,b,c)(b)}();return null==d?null:ih(d,R([jh,!0]))}()],null),e=function(){return function(){function a(a){Zg(R([[C.a("aborting for auth: "),C.a(a)].join("")]));return tableau.abortForAuth(a)}function c(){return b.m?
b.m():b.call(null)}var d=null;d=function(b){switch(arguments.length){case 0:return c.call(this);case 1:return a.call(this,b)}throw Error("Invalid arity: "+(arguments.length-1));};d.m=c;d.a=a;return d}()}(c,d);Zg(R([[C.a("tab-init: entering phase: "),C.a(c)].join("")]));tableau.authType=Wn(a);tableau.version="2.2";Un.f?Un.f(a,c,d):Un.call(null,a,c,d);return O.b(c,"gatherData")?Vn.f?Vn.f(a,d,e):Vn.call(null,a,d,e):b.m?b.m():b.call(null)},no);oo.shutdown=ff(Xn,no);
oo.getSchema=ff(function(a,b){Zg(R(["tab-get-schema"]));var c=fh;var d=In?Jn?Kn(vi,Qn(a)):Qn(a):Qn(a);c=c(d);d=fh;var e=In?Jn?Kn(Wj,Rn(a)):Rn(a):Rn(a);d=d(e);return b.b?b.b(c,d):b.call(null,c,d)},no);
oo.getData=ff(function(a,b,c){Zg(R(["tab-get-data"]));var d=b.tableInfo,e=b.incrementValue,f=ih(b.filterValues,R([jh,!1]));b=b.appendRows;var g=In?Jn?Kn(yk,ih(d,R([jh,!0]))):ih(d,R([jh,!0])):ih(d,R([jh,!0]));a=Sn.w?Sn.w(a,g,e,f):Sn.call(null,a,g,e,f);var k=Bm(1);gm(function(a,b,d,e,f,g,k){return function(){var l=function(){return function(a){return function(){function b(b){for(;;){a:try{for(;;){var c=a(b);if(!xe(c,gj)){var d=c;break a}}}catch(ea){if(ea instanceof Object)b[5]=ea,ym(b),d=gj;else throw ea;
}if(!xe(d,gj))return d}}function c(){var a=[null,null,null,null,null,null,null,null,null,null,null,null,null];a[0]=d;a[1]=1;return a}var d=null;d=function(a){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,a)}throw Error("Invalid arity: "+(arguments.length-1));};d.m=c;d.a=b;return d}()}(function(a,b,d,e,f,g,k){return function(a){var b=a[1];if(1===b)return a[7]=0,a[2]=null,a[1]=2,gj;if(2===b)return vm(a,k);if(3===b)return xm(a,a[2]);if(4===b)return b=a[2],a[8]=b,a[1]=
w(b)?5:6,gj;if(5===b){var d=a[7];var e=a[8];b=fh(e);b=f.a?f.a(b):f.call(null,b);e=Q(e);d+=e;e=Sj.a(g);var l=[C.a(e),C.a(": "),C.a(d),C.a(" rows fetched")].join("");e=Zg(R([l]));l=tableau.reportProgress(l);a[9]=l;a[7]=d;a[10]=b;a[11]=e;a[2]=null;a[1]=2;return gj}return 6===b?(d=Zg(R(["tab-get-data DONE"])),b=c.m?c.m():c.call(null),a[12]=d,a[2]=b,a[1]=7,gj):7===b?(a[2]=a[2],a[1]=3,gj):null}}(a,b,d,e,f,g,k),a,b,d,e,f,g,k)}(),m=function(){var b=l.m?l.m():l.call(null);b[6]=a;return b}();return um(m)}}(k,
d,e,f,b,g,a));return k},no);tableau.registerConnector(oo);function po(){Zg(R(["Go!"]));return Yn()}var qo=["webplotdigitizer_wdc","core","go"],ro=aa;qo[0]in ro||!ro.execScript||ro.execScript("var "+qo[0]);for(var so;qo.length&&(so=qo.shift());)qo.length||void 0===po?ro=ro[so]&&ro[so]!==Object.prototype[so]?ro[so]:ro[so]={}:ro[so]=po;
})();
