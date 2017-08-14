(ns webplotdigitizer-wdc.core
  (:require [goog.object]
            [goog.dom]
            [goog.style]
            [cljs.core.async :as async]
            [cljs-wdc.core :as wdc]
            [wpd])
  (:require-macros [cljs.core.async.macros :as async]))

(set! *warn-on-infer* true)

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

(defn dataset->table-info [dataset]
  (let [name (.-name dataset)
        id (clojure.string/replace name #"\W+" "_")]
    {:id id
     :alias name
     :columns [{:id "x" :dataType "float"}
               {:id "y" :dataType "float"}]}))

(deftype WebPlotDigitizerWDC []
  wdc/IWebDataConnector
  (get-auth-type [this] "none")
  (check-auth [this state done] (done))
  (get-standard-connections [this] [])
  (get-name [this] "WebPlotDigitizer")
  (get-table-infos [this]
    (map dataset->table-info (get-datasets)))
  (<get-rows [this {:keys [alias] :as table-info} increment-value filter-values]
    (let [out (async/chan)]
      (if-let [dataset (first (filter #(= alias (.-name %)) (get-datasets)))]
        (if-let [axes (-> js/wpd (.-appData) (.getPlotData) (.-axes))]
          (let [pixel->data (fn [pixel]
                              (let [px (goog.object/get pixel "x")
                                    py (goog.object/get pixel "y")
                                    f (goog.object/get axes "pixelToData")]
                                (f px py)))
                get-row (fn [i]
                          (let [get-pixel (goog.object/get dataset "getPixel")
                                pixel (get-pixel i)
                                [dx dy] (pixel->data pixel)]
                            {:x dx :y dy}))
                count ((goog.object/get dataset "getCount"))
                rows (map get-row (range count))]
            (async/go
              (async/>! out rows)
              (async/close! out)))
          (throw "Axes are not calibrated"))
        (throw (str "Data set named \"" alias "\" is not defined")))
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
      (do
        (set-json! (get-in state [:connection-data :json]))))))

(def wdc (WebPlotDigitizerWDC.))
(wdc/register! wdc)

(defn ^:export go []
  (println "Go!")
  (wdc/go! wdc))

(defn on-js-reload []
  (println "on-js-reload"))
