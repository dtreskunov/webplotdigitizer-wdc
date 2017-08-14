(ns webplotdigitizer-wdc.core
  (:require [goog.object]
            [cljs-wdc.core :as wdc]
            [wpd])
  (:require-macros [cljs.core.async.macros :as async]))

; (set! *warn-on-infer* true)

(defn oget [obj key]
  (goog.object/get obj key))

(defonce app-state (atom {:show-ui? true
                          :called-by-tableau? false}))
(defonce wdc-state (atom {:connection-data {:calibration {}
                                            :data-sets []}}))

(deftype WebPlotDigitizerWDC []
  wdc/IWebDataConnector
  (get-auth-type [this] "none")
  (check-auth [this state done] (done))
  (get-standard-connections [this] [])
  (get-name [this] "WebPlotDigitizer")
  (get-table-infos [this]
    [{:id "data_series_1"
      :alias   "data_series_1"
      :columns [{:id "x" :dataType "float"}
                {:id "y" :dataType "float"}]}])
  (<get-rows [this {:keys [id] :as table-info} increment-value filter-values]
    nil)
  (shutdown [this] @wdc-state)
  (init [this phase state]
    (swap! wdc-state merge state)
    (swap! app-state merge {:show-ui? (#{"auth" "interactive"} phase)
                            :auth-only? (= "auth" phase)
                            :called-by-tableau? true})))

(def wdc (WebPlotDigitizerWDC.))
(wdc/register! wdc)

(defn ^:export go []
  (println "Go!")
  (wdc/go! wdc))

(defn on-js-reload []
  ;; optionally touch your app-state to force rerendering depending on
  ;; your application
  (swap! app-state update-in [:__figwheel_counter] inc)
)
