/**********************************************************************
 * Extern for wpd
 * Generated by http://jmmk.github.io/javascript-externs-generator
 **********************************************************************/
var wpd = {
  "AddMeasurementTool": function () {},
  "AdjustDataPointTool": function () {},
  "AdjustMeasurementTool": function () {},
  "AlignmentCornersRepainter": function () {},
  "AutoDetector": function () {},
  "AveragingWindowAlgo": function () {},
  "AveragingWindowCore": function () {},
  "AveragingWindowWithStepSizeAlgo": function () {},
  "AxesCornersTool": function () {},
  "BarAxes": function () {},
  "BarExtractionAlgo": function () {},
  "BarValue": function () {},
  "BlobDetectorAlgo": function () {},
  "BoxMaskTool": function () {},
  "Calibration": function () {},
  "ColorFilterRepainter": function () {},
  "ColorGroup": function () {},
  "ColorPickerTool": function () {},
  "ConnectedPoints": function () {},
  "DataPointsRepainter": function () {},
  "DataSeries": function () {},
  "DeleteDataPointTool": function () {},
  "DeleteMeasurementTool": function () {},
  "EditLabelsTool": function () {},
  "EraseMaskTool": function () {},
  "GridBoxTool": function () {},
  "GridColorFilterRepainter": function () {},
  "GridMaskPainter": function () {},
  "GridViewMaskTool": function () {},
  "ImageAxes": function () {},
  "InputParser": function () {},
  "ManualSelectionTool": function () {},
  "MapAxes": function () {},
  "MaskPainter": function () {},
  "MeasurementRepainter": function () {},
  "PenMaskTool": function () {},
  "PlotData": function () {},
  "PolarAxes": function () {},
  "TernaryAxes": function () {},
  "ViewMaskTool": function () {},
  "XStepWithInterpolationAlgo": function () {},
  "XYAxes": function () {},
  "acquireData": {
    "adjustPoints": function () {},
    "changeDataset": function () {},
    "clearAll": function () {},
    "deletePoint": function () {},
    "editLabels": function () {},
    "isToolSwitchKey": function () {},
    "load": function () {},
    "manualSelection": function () {},
    "showSidebar": function () {},
    "switchToolOnKeyPress": function () {},
    "undo": function () {},
    "updateDatasetControl": function () {}
  },
  "ajax": {
    "get": function () {},
    "post": function () {}
  },
  "algoManager": {
    "applyAlgoSelection": function () {},
    "run": function () {},
    "updateAlgoList": function () {}
  },
  "alignAxes": {
    "align": function () {},
    "calibrationCompleted": function () {},
    "editAlignment": function () {},
    "getActiveCalib": function () {},
    "getCornerValues": function () {},
    "reloadCalibrationForEditing": function () {},
    "setActiveCalib": function () {},
    "start": function () {}
  },
  "appData": {
    "getPlotData": function () {},
    "getCorsProxy": function () {},
    "getCorsProxyURL": function () {},
    "setCorsProxy": function () {},
    "getImageName": function () {},
    "setImageName": function () {},
    "isAligned": function () {},
    "plotLoaded": function () {},
    "reset": function () {}
  },
  "args": {
    "getValue": function () {}
  },
  "autoExtraction": {
    "changeDataset": function () {},
    "start": function () {},
    "updateDatasetControl": function () {}
  },
  "barCalibration": {
    "align": function () {},
    "getCornerValues": function () {},
    "pickCorners": function () {},
    "reload": function () {},
    "start": function () {}
  },
  "browserInfo": {
    "checkBrowser": function () {}
  },
  "busyNote": {
    "close": function () {},
    "show": function () {}
  },
  "colorAnalyzer": {
    "getTopColors": function () {}
  },
  "colorPicker": {
    "changeColorDistance": function () {},
    "changeDetectionMode": function () {},
    "init": function () {},
    "startPicker": function () {},
    "testColorDetection": function () {}
  },
  "colorSelectionWidget": {
    "paintFilteredColor": function () {},
    "pickColor": function () {},
    "selectTopColor": function () {},
    "setColor": function () {},
    "setParams": function () {},
    "startPicker": function () {}
  },
  "cspline": function () {},
  "cspline_interp": function () {},
  "dataExport": {
    "exportToPlotly": function () {},
    "generateCSV": function () {},
    "show": function () {}
  },
  "dataMask": {
    "clearMask": function () {},
    "eraseMarks": function () {},
    "grabMask": function () {},
    "markBox": function () {},
    "markPen": function () {},
    "viewMask": function () {}
  },
  "dataPointCounter": {
    "setCount": function () {}
  },
  "dataPointLabelEditor": {
    "cancel": function () {},
    "keydown": function () {},
    "ok": function () {},
    "show": function () {}
  },
  "dataSeriesManagement": {
    "addSeries": function () {},
    "changeSelectedSeries": function () {},
    "deleteSeries": function () {},
    "editSeriesName": function () {},
    "manage": function () {},
    "viewData": function () {}
  },
  "dataTable": {
    "changeDataset": function () {},
    "exportToPlotly": function () {},
    "generateCSV": function () {},
    "reSort": function () {},
    "selectAll": function () {},
    "showAngleData": function () {},
    "showDistanceData": function () {},
    "showTable": function () {},
    "updateSortingControls": function () {}
  },
  "dateConverter": {
    "formatDate": function () {},
    "formatDateNumber": function () {},
    "getFormatString": function () {},
    "parse": function () {}
  },
  "dist2d": function () {},
  "dist3d": function () {},
  "download": {
    "csv": function () {},
    "json": function () {}
  },
  "gettext": function () {},
  "graphicsHelper": {
    "drawPoint": function () {}
  },
  "graphicsWidget": {
    "copyImageDataLayerToScreen": function () {},
    "forceHandlerRepaint": function () {},
    "getAllContexts": function () {},
    "getDisplaySize": function () {},
    "getImageDataURL": function () {},
    "getImageSize": function () {},
    "getRepainter": function () {},
    "getZoomRatio": function () {},
    "imagePx": function () {},
    "load": function () {},
    "loadImageFromData": function () {},
    "loadImageFromURL": function () {},
    "removeRepainter": function () {},
    "removeTool": function () {},
    "resetData": function () {},
    "resetHover": function () {},
    "runImageOp": function () {},
    "saveImage": function () {},
    "screenPx": function () {},
    "setRepainter": function () {},
    "setTool": function () {},
    "setZoomRatio": function () {},
    "toggleExtendedCrosshairBtn": function () {},
    "updateZoomOnEvent": function () {},
    "updateZoomToImagePosn": function () {},
    "zoom100perc": function () {},
    "zoomFit": function () {},
    "zoomIn": function () {},
    "zoomOut": function () {}
  },
  "gridDetection": {
    "changeBackgroundMode": function () {},
    "changeColorDistance": function () {},
    "clearMask": function () {},
    "grabMask": function () {},
    "markBox": function () {},
    "reset": function () {},
    "run": function () {},
    "start": function () {},
    "startColorPicker": function () {},
    "testColor": function () {},
    "viewMask": function () {}
  },
  "gridDetectionCore": {
    "run": function () {},
    "setHorizontalParameters": function () {},
    "setVerticalParameters": function () {}
  },
  "imageOps": {
    "hflip": function () {},
    "vflip": function () {}
  },
  "initApp": function () {},
  "keyCodes": {
    "isAlphabet": function () {},
    "isBackspace": function () {},
    "isDel": function () {},
    "isDown": function () {},
    "isEnter": function () {},
    "isEsc": function () {},
    "isLeft": function () {},
    "isRight": function () {},
    "isTab": function () {},
    "isUp": function () {}
  },
  "layoutManager": {
    "getGraphicsViewportSize": function () {},
    "initialLayout": function () {}
  },
  "loadRemoteData": function () {},
  "mapCalibration": {
    "align": function () {},
    "getCornerValues": function () {},
    "pickCorners": function () {},
    "reload": function () {},
    "start": function () {}
  },
  "mat": {
    "det2x2": function () {},
    "inv2x2": function () {},
    "mult2x2": function () {},
    "mult2x2Vec": function () {},
    "multVec2x2": function () {}
  },
  "measurement": {
    "addItem": function () {},
    "clearAll": function () {},
    "deleteItem": function () {},
    "start": function () {}
  },
  "measurementDataProvider": {
    "getData": function () {},
    "getDatasetIndex": function () {},
    "getDatasetNames": function () {},
    "setDataSource": function () {},
    "setDatasetIndex": function () {}
  },
  "measurementModes": {
    "angle": {
      "addButtonId": {},
      "clear": function () {},
      "connectivity": {},
      "deleteButtonId": {},
      "getData": function () {},
      "init": function () {},
      "name": {},
      "sidebarId": {}
    },
    "closedPath": {
      "addButtonId": {},
      "clear": function () {},
      "connectivity": {},
      "deleteButtonId": {},
      "getData": function () {},
      "init": function () {},
      "name": {},
      "sidebarId": {}
    },
    "distance": {
      "addButtonId": {},
      "clear": function () {},
      "connectivity": {},
      "deleteButtonId": {},
      "getData": function () {},
      "init": function () {},
      "name": {},
      "sidebarId": {}
    },
    "openPath": {
      "addButtonId": {},
      "clear": function () {},
      "connectivity": {},
      "deleteButtonId": {},
      "getData": function () {},
      "init": function () {},
      "name": {},
      "sidebarId": {}
    }
  },
  "messagePopup": {
    "close": function () {},
    "show": function () {}
  },
  "okCancelPopup": {
    "cancel": function () {},
    "ok": function () {},
    "show": function () {}
  },
  "perspective": {
    "pickCorners": function () {},
    "revert": function () {},
    "run": function () {},
    "start": function () {}
  },
  "perspectiveCornersRepainter": function () {},
  "perspectiveCornersTool": function () {},
  "plotDataProvider": {
    "getData": function () {},
    "getDatasetIndex": function () {},
    "getDatasetNames": function () {},
    "setDatasetIndex": function () {}
  },
  "plotly": {
    "send": function () {}
  },
  "polarCalibration": {
    "align": function () {},
    "getCornerValues": function () {},
    "pickCorners": function () {},
    "reload": function () {},
    "start": function () {}
  },
  "popup": {
    "close": function () {},
    "show": function () {}
  },
  "saveResume": {
    "download": function () {},
    "generateJSON": function () {},
    "load": function () {},
    "read": function () {},
    "resumeFromJSON": function () {},
    "save": function () {}
  },
  "scriptInjector": {
    "cancel": function () {},
    "load": function () {},
    "start": function () {}
  },
  "sidebar": {
    "clear": function () {},
    "resize": function () {},
    "show": function () {}
  },
  "sqDist2d": function () {},
  "sqDist3d": function () {},
  "taninverse": function () {},
  "ternaryCalibration": {
    "align": function () {},
    "getCornerValues": function () {},
    "pickCorners": function () {},
    "reload": function () {},
    "start": function () {}
  },
  "toolbar": {
    "clear": function () {},
    "show": function () {}
  },
  "transformationEquations": {
    "show": function () {}
  },
  "unsupported": function () {},
  "webcamCapture": {
    "cancel": function () {},
    "capture": function () {},
    "start": function () {}
  },
  "websocket": {
    "connect": function () {},
    "notify": function () {},
    "registerNotification": function () {},
    "registerRequest": function () {},
    "request": function () {}
  },
  "xyCalibration": {
    "align": function () {},
    "getCornerValues": function () {},
    "pickCorners": function () {},
    "reload": function () {},
    "start": function () {}
  },
  "zoomView": {
    "applySettings": function () {},
    "getSize": function () {},
    "getZoomRatio": function () {},
    "initZoom": function () {},
    "setCoords": function () {},
    "setZoomImage": function () {},
    "setZoomRatio": function () {},
    "showSettingsWindow": function () {}
  }
};
wpd.BarAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
wpd.ImageAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
wpd.MapAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
wpd.PolarAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
wpd.TernaryAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
wpd.XYAxes.prototype = {
  "getAxesLabels": function () {},
  "getDimensions": function () {},
  "numCalibrationPointsRequired": function () {}
};
/**********************************************************************
 * End Generated Extern for wpd
/**********************************************************************/