import mapboxgl from "maplibre-gl";
import provincesData from "../gis/data/provincial-vaccination-data_2.json";
import React, { useEffect, useMemo, useState } from "react";
import BaseMap from "./BaseMap";
import { createCallbackWithLayer, MapWindow } from "./util";
import _ from "lodash";
import onLoadHandler from "./coverage-load";
import moment from "moment";

const InfoBox = (props) => {
  return (
    <div className="infoBox rounded shadow-sm" style={{ width: 300 }}>
      {props.hoveredData && (
        <div>
          <div>
            <b>จังหวัด{props.hoveredData.name}</b><br />
            <div className="row" style={{ fontSize: "90%" }}>
              <div className="col-7 pr-0">
                <div>ได้รับวัคซีนครบแล้ว</div>
              </div>
              <div className="col-5 d-flex justify-content-center align-items-center">
                <div>
                  <b>
                    {(
                      (props.hoveredData["total-2nd-dose"] * 100) /
                      props.hoveredData["population"]
                    ).toFixed(1)}
                    %
                  </b>
                </div>
                <div className="ml-2 doses-progress-map">
                  <div
                    className="doses-bar"
                    style={{
                      width: `${(props.hoveredData["total-2nd-dose"] * 100) /
                        props.hoveredData["population"]
                        }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="col-7 pr-0">
                <div>ได้รับวัคซีนอย่างน้อย 1 โดส</div>
              </div>
              <div className="col-5 d-flex justify-content-center align-items-center">
                <div>
                  <b>
                    {(
                      (props.hoveredData["total-1st-dose"] * 100) /
                      props.hoveredData["population"]
                    ).toFixed(1)}
                    %
                  </b>
                </div>
                <div className="ml-2 doses-progress-map">
                  <div
                    className="doses-bar"
                    style={{
                      width: `${(props.hoveredData["total-1st-dose"] * 100) /
                        props.hoveredData["population"]
                        }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="col-12 text-muted mt-2">
                <div className="font-weight-bold">
                  {props.hoveredData["population"] >
                    props.hoveredData["registered_population"] &&
                    `มีประชากรแฝงประมาณ ${(
                      props.hoveredData["population"] -
                      props.hoveredData["registered_population"]
                    ).toLocaleString()} คน`}
                </div>
                <div>
                  ข้อมูลเมื่อ {moment().diff(moment(provincesData["update_at"]), 'days')} วันก่อน
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
};

const CoverageMap = () => {
  const [hoveredData, setHoveredData] = useState<any>();
  const [infoBoxPosition, setInfoBoxPosition] =
    useState<{ x: number; y: number }>();
  const [linkedWindow, setLinkedWindow] = useState<MapWindow>({
    hoveredStateId: 0,
  } as MapWindow);
  useEffect(() => {
    (window as MapWindow).hoveredStateId = 0;
    setLinkedWindow(window as MapWindow);
  }, []);
  const onClicks = useMemo(
    () => [
      createCallbackWithLayer("province-fills", (map: mapboxgl.Map, e) => {
        var centroid_x = e.features[0].properties["centroid"]
          .split(":")[1]
          .split(",")[0];
        var centroid_y = e.features[0].properties["centroid"]
          .split(":")[1]
          .split(",")[1]
          .split(")")[0];
        map.flyTo({ center: [centroid_x, centroid_y], zoom: 7 });
      }),
    ],
    []
  );
  const onMouseleaves = useMemo(
    () => [
      createCallbackWithLayer("province-fills", (map, e) => {
        if (linkedWindow.hoveredStateId) {
          map.setFeatureState(
            {
              source: "provinces",
              sourceLayer: "60c4fbfcceacf1b5ea19ae9a",
              id: linkedWindow.hoveredStateId,
            },
            { hover: false }
          );
        }
        setHoveredData(null);
        linkedWindow.hoveredStateId = null;
      }),
    ],
    []
  );
  const onMousemoves = useMemo(
    () => [
      createCallbackWithLayer("province-fills", (map, e) => {
        setInfoBoxPosition(e.point);
        if (e.features.length <= 0) return;

        if (linkedWindow.hoveredStateId) {
          map.setFeatureState(
            {
              source: "provinces",
              sourceLayer: "60c4fbfcceacf1b5ea19ae9a",
              id: linkedWindow.hoveredStateId,
            },
            { hover: false }
          );
        }
        linkedWindow.hoveredStateId = e.features[0].id;
        map.setFeatureState(
          {
            source: "provinces",
            sourceLayer: "60c4fbfcceacf1b5ea19ae9a",
            id: linkedWindow.hoveredStateId,
          },
          { hover: true }
        );
        if (!hoveredData) {
          const data = _.find(provincesData["data"], {
            id: e.features[0].properties["PROV_CODE"],
          });
          setHoveredData(data);
        } else if (
          hoveredData["id"] !== e.features[0].properties["PROV_CODE"]
        ) {
          const data = _.find(provincesData["data"], {
            id: e.features[0].properties["PROV_CODE"],
          });
          setHoveredData(data);
        }
      }),
    ],
    []
  );

  return (
    <BaseMap
      onLoad={onLoadHandler}
      onMove={[]}
      onClick={onClicks}
      onMousemove={onMousemoves}
      onMouseleave={onMouseleaves}
      credits={
        <div
          className="container text-sec mt-3 credit"
          style={{ maxWidth: 810 }}
        >
          ที่มาข้อมูล: รายงานการฉีดวัคซีน กรมควบคุมโรค กระทรวงสาธารณสุข
          (อัพเดทล่าสุดเมื่อ {moment(provincesData["update_at"]).format("LL")}),
          สถิติประชากรศาสตร์ สำนักงานสถิติแห่งชาติ, รายงานประชากรแฝง
          สำนักงานสถิติแห่งชาติ
        </div>
      }
    >
      {hoveredData && (
        <div
          className="infoBox-container d-md-block d-none"
          style={{
            top: infoBoxPosition.y + 20,
            left: infoBoxPosition.x,
          }}
        >
          <InfoBox hoveredData={hoveredData} />
        </div>
      )}
      {hoveredData && (
        <div className="infoBox-container d-md-none d-block">
          <InfoBox hoveredData={hoveredData} />
        </div>
      )}
    </BaseMap>
  );
};

export default CoverageMap;
