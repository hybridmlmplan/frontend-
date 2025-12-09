import React from "react";
import PageTemplate from "../PageTemplate";
export default function DailyClosingView(){ return <PageTemplate title="Daily Closing" endpoint="/session/closing" columns={[{key:'session',label:'Session'},{key:'pairsProcessed',label:'Pairs'},{key:'date',label:'Date'}]} />; }
