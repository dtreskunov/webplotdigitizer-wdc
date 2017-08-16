(ns webplotdigitizer-wdc.core
  (:require [goog.object]
            [goog.dom]
            [goog.style]
            [cljs.core.async :as async]
            [cljs-wdc.core :as wdc]
            [wpd])
  (:require-macros [cljs.core.async.macros :as async]))

(-> js/wpd
    .-appData
    (.setCorsProxy "https://dtreskunov-cors-anywhere.herokuapp.com"))

(defn get-json []
  (-> js/wpd
      (.-saveResume)
      (.generateJSON)))

(defn get-image []
  (-> js/wpd
      (.-graphicsWidget)
      (.getImageDataURL "image/jpeg" 0.92)))

(defn get-image-name []
  (-> js/wpd
      (.-appData)
      (.getImageName)))

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

(defn get-all-data
  "Returns seq of {:strs [name fields fieldDateFormat rawData isFieldSortable]}"
  []
  (->> (get-datasets)
       (map (-> js/wpd .-plotDataProvider .-getData))
       js->clj))

(defn get-alias [dataset-name field-name]
  (str dataset-name ", " field-name))

(defn get-id [dataset-name field-name]
  (clojure.string/replace (get-alias dataset-name field-name)
                          #"\W+" "_"))

(defn data->column-infos [{:strs [name fields fieldDateFormat rawData isFieldSortable]}]
  (for [i (range (count fields))
        :let [field (nth fields i)
              sortable? (nth isFieldSortable i)]]
    {:id (get-id name field)
     :alias (get-alias name field)
     :dataType (if sortable? "float" "string")
     :columnRole "dimension"
     :columnType (if sortable? "continuous" "discrete")}))

(defn data->rows [{:strs [name fields fieldDateFormat rawData isFieldSortable]}]
  (let [ids (for [field fields] (get-id name field))]
    (for [row rawData]
      (zipmap ids row))))

(deftype WebPlotDigitizerWDC []
  wdc/IWebDataConnector
  (get-auth-type [this] "none")
  (check-auth [this state done] (done))
  (get-standard-connections [this] [])
  (get-name [this] (or (get-image-name) "WebPlotDigitizer"))
  (get-table-infos [this]
    [{:id "WebPlotDigitizer"
      :alias "image"
      :columns (mapcat data->column-infos (get-all-data))}])
  (<get-rows [this table-info increment-value filter-values]
    (let [out (async/chan)]
      (async/go
        (doseq [data (get-all-data)]
          (async/>! out (data->rows data)))
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
  (or (-> js/wpd (.-appData) (.getPlotData) (.-axes))
      (throw "Axes are not calibrated."))
  (wdc/go! wdc))

(defn on-js-reload []
  (println "on-js-reload"))
