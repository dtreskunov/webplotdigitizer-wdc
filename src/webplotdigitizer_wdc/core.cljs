(ns webplotdigitizer-wdc.core
  (:require [goog.object]
            [goog.dom]
            [goog.style]
            [cljs.core.async :as async]
            [cljs-wdc.core :as wdc]
            [wpd])
  (:require-macros [cljs.core.async.macros :as async]))

(goog.object/setIfUndefined js/wpd "corsProxy" "https://dtreskunov-cors-anywhere.herokuapp.com")

(defn get-json []
  (-> js/wpd
      (.-saveResume)
      (.generateJSON)))

(defn get-image []
  (-> js/wpd
      (.-graphicsWidget)
      (.getImageDataURL)))

(defn set-json! [s]
  (when-let [obj (.parse js/JSON s)]
    (-> js/wpd
        (.-saveResume)
        (.resumeFromJSON obj))))

(defn set-image! [image callback]
  (-> js/wpd
      (.-graphicsWidget)
      (.loadImageFromURL image callback)))

(defn hide-loading-screen! []
  (let [loading-screen (goog.dom/getElement "loadingCurtain")]
    (goog.style/setElementShown loading-screen false)))

(defn get-datasets []
  (-> js/wpd
      (.-appData)
      (.getPlotData)
      (goog.object/get "dataSeriesColl")))

(defn get-id [dataset s]
  (let [name (.-name dataset)
        prefix (if (= name "Default Dataset") "" (str name " "))
        quote-id #(clojure.string/replace % #"\W+" "_")]
    (quote-id (str prefix s))))

(defn get-id-dx [dataset] (get-id dataset "x"))
(defn get-id-dy [dataset] (get-id dataset "y"))
(defn get-id-px [dataset] (get-id dataset "x pixel"))
(defn get-id-py [dataset] (get-id dataset "y pixel"))

(defn dataset->column-infos [dataset]
  [{:id (get-id-dx dataset) :dataType "float" :columnRole "dimension" :columnType "continuous"}
   {:id (get-id-dy dataset) :dataType "float" :columnRole "dimension" :columnType "continuous"}
   {:id (get-id-px dataset) :dataType "int" :columnRole "dimension" :columnType "continuous"}
   {:id (get-id-py dataset) :dataType "int" :columnRole "dimension" :columnType "continuous"}])

(defn datasets->table-infos [datasets]
  [{:id "WebPlotDigitizer"
    :alias "Datasets"
    :columns (mapcat dataset->column-infos datasets)}])

(deftype WebPlotDigitizerWDC []
  wdc/IWebDataConnector
  (get-auth-type [this] "none")
  (check-auth [this state done] (done))
  (get-standard-connections [this] [])
  (get-name [this] "WebPlotDigitizer")
  (get-table-infos [this]
    (datasets->table-infos (get-datasets)))
  (<get-rows [this table-info increment-value filter-values]
    (let [out (async/chan)
          axes (or (-> js/wpd (.-appData) (.getPlotData) (.-axes))
                   (throw "Axes are not calibrated"))
          p->d (goog.object/get axes "pixelToData")]
      (async/go
        (doseq [dataset (get-datasets)
                :let [get-pixel (goog.object/get dataset "getPixel")
                      get-count (goog.object/get dataset "getCount")
                      id-dx (get-id-dx dataset)
                      id-dy (get-id-dy dataset)
                      id-px (get-id-px dataset)
                      id-py (get-id-py dataset)
                      get-row (fn [i]
                                (let [pixel (get-pixel i)
                                      px (goog.object/get pixel "x")
                                      py (goog.object/get pixel "y")
                                      [dx dy] (p->d px py)]
                                  {id-dx dx
                                   id-dy dy
                                   id-px px
                                   id-py py}))
                      rows (map get-row (range (get-count)))]]
          (async/>! out rows))
        (async/close! out))
      out))
  (shutdown [this]
    {:connection-data {:json (get-json)
                       :image (get-image)}})
  (init [this phase state]
    (case phase
      ("auth" "interactive")
      (do
        (-> js/wpd (.-browserInfo) (.checkBrowser))
        (-> js/wpd (.-layoutManager) (.initialLayout))
        (hide-loading-screen!)
        (set-image!
         (or (get-in state [:connection-data :image])
             "images/start.png")
         (fn []
           (set-json! (get-in state [:connection-data :json]))
           (when (-> js/wpd (.-appData) (.isAligned))
             (-> js/wpd (.-acquireData) (.load))))))
      "gatherData"
      (set-json! (get-in state [:connection-data :json])))))

(def wdc (WebPlotDigitizerWDC.))
(wdc/register! wdc)

(defn ^:export go []
  (println "Go!")
  (wdc/go! wdc))

(defn on-js-reload []
  (println "on-js-reload"))
