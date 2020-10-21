export function getStyles(elementId) {
    return `#${elementId} {
                display: flex;
                height: calc(100vh - 160px);
                width: 100%;
                flex-direction: column;
            }

            #${elementId} svg {
                width: 100%;
                -moz-user-select: none; /* Firefox */
                -ms-user-select: none; /* Internet Explorer */
               -khtml-user-select: none; /* KHTML browsers (e.g. Konqueror) */
              -webkit-user-select: none; /* Chrome, Safari, and Opera */
              -webkit-touch-callout: none; /* Disable Android and iOS callouts*/ }

            #${elementId} circle {
                fill: #c8c8c8;
            }

            #${elementId} circle.base {
                fill: #e0e0e0;
            }

            #${elementId} .dot:not(.group) {
                cursor: pointer;
            }

            #${elementId} svg .filter-text {
                font-size: 1.2rem;
                dominant-baseline: middle;
            }
    
            #${elementId} svg .filter {
                cursor: pointer;
            }
    
            #${elementId} svg .filter.disabled {
                opacity: .5;
            }
    
            #${elementId} svg .visualization-title {
                dominant-baseline: hanging;
                text-anchor: middle;
            }

            #${elementId} .summary-pane {
                background-color: white;
                max-height: 100vh;
                max-width: 50vw;
                overflow: auto;
                top: 50%;
                transform: translateY(-50%);
                left: 0px;
                box-shadow: black 0px 0px 5px;
                padding: 10px;
                display: none;
                position: fixed;
                z-index: 10000;
            }

            #${elementId} .lds-dual-ring {
                margin-left: auto;
                margin-right: auto;
                display: block;
                width: 64px;
                height: 64px;
              }

              #${elementId} .lds-dual-ring:after {
                content: " ";
                display: block;
                width: 46px;
                height: 46px;
                margin: 1px;
                border-radius: 50%;
                border: 5px solid #fff;
                border-color: grey transparent grey transparent;
                animation: lds-dual-ring 1.2s linear infinite;
              }

              @keyframes lds-dual-ring {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }

              // Needed?
              //
              //
              //
        
              #${elementId} text {
                font-size: 1em;
            }
        
            #${elementId} .bucket-label,
            #${elementId} .visualization-title {
                dominant-baseline: hanging;
                text-anchor: middle;
            }
        
            #${elementId} .filter, .bucket {
                cursor: pointer;
            }
        
            #${elementId} .filter.disabled {
                opacity: .3;
            }
        
            #${elementId} .filter-text {
                dominant-baseline: middle;
                font-size: 1em;
            }
        
            #${elementId} .group {
                fill: antiquewhite
            }
        
            #${elementId} .diagram {
                transform: translate(0px, 50px);
            }
        
            #${elementId} foreignObject td:first-child {
                text-align: left;
            }
        
            #${elementId} foreignObject tr:not(:first-child) {
                height: 2em;
            }
        
            #${elementId} foreignObject tr:nth-child(2n+1) {
                background-color: #efefef;
            }
        
            #${elementId} .custom-css {
                display: none;
            }
        
            #${elementId} .labels text {
                dominant-baseline: middle;
                text-anchor: start;
            }
        
            #${elementId} .enabledByDefault label {
                float: left;
                margin-left: 30px;
                font-weight: 400;
            }
        
            #${elementId} .bucket-line {
                stroke-width: 3;
                stroke: black;
            }

            #${elementId} .toolbar {
                display: flex;
                justify-content: flex-end;
            }

            #${elementId} .toolbar .button {
                width: 40px;
                height: 40px;
                text-align: center;
                cursor: pointer;
                line-height: 40px;
                background-color: white;
            }
        
            #${elementId} .toolbar>div {
                border-radius: 10px;
                /*margin-right: 100px;*/
                overflow: hidden;
            }

            #${elementId} .toolbar div.group {
                display: flex;
            }
        
            #${elementId} .style-selector div, .full-screen div {
                width: 40px;
                height: 40px;
                text-align: center;
                cursor: pointer;
                line-height: 40px;
            }

            #${elementId} .selection-pane {
                box-shadow: 0px 2px 5px black;
                height: 0vh;
                transition: height 1s;
                position: absolute;
                top: 45px;
                right: 10px;
                width: 250px;
                background-color: #efefef;
                overflow: hidden;
            }

            #${elementId} .selection-pane.open {
                height: 50vh;
                
            }

            #${elementId} .selection-pane .toolbar {
                padding-top: 10px;
                padding-right: 10px;                
            }

            #${elementId} .selection-pane .toolbar a {
                padding: 5px;               
            }
        `;
}