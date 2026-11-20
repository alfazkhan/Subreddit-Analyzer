const exhaustiveEChartsOption = {
  // ==========================================
  // 1. GLOBAL CANVAS & ANIMATION SETTINGS
  // Controls the root environment and rendering engine behavior
  // ==========================================
  backgroundColor: {
    type: 'linear',
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [{ offset: 0, color: '#1a1a1a' }, { offset: 1, color: '#000000' }]
  },
  color: ['#dd6b20', '#3182ce', '#38a169'], 
  darkMode: true, 
  animation: true, 
  animationThreshold: 2000, 
  animationDuration: 1000, 
  animationEasing: 'cubicOut', 
  animationDelay: 0, 
  animationDurationUpdate: 300, 
  animationEasingUpdate: 'cubicOut', 
  blendMode: 'source-over', 

  // ==========================================
  // 2. TITLE
  // Handles main headings, subheadings, and rich text styling
  // ==========================================
  title: {
    show: true,
    text: 'Advanced Analytics',
    link: 'https://example.com', 
    target: 'blank', 
    subtext: 'Deep dive into every property',
    sublink: '',
    subtarget: 'blank',
    textAlign: 'auto', 
    textVerticalAlign: 'auto', 
    padding: [5, 10, 5, 10], 
    itemGap: 10, 
    zlevel: 0, 
    z: 2, 
    left: '5%', 
    top: 20,
    right: 'auto',
    bottom: 'auto',
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderColor: '#333', 
    borderWidth: 1,
    borderRadius: 4, 
    shadowBlur: 10, 
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    textStyle: {
      color: '#ffffff',
      fontStyle: 'normal', 
      fontWeight: 'bold', 
      fontFamily: 'sans-serif',
      fontSize: 18,
      lineHeight: 24,
      width: 200, 
      overflow: 'truncate', 
      textBorderColor: '#000', 
      textBorderWidth: 0,
      textShadowColor: 'transparent',
      textShadowBlur: 0,
      rich: { 
        highlight: { color: '#dd6b20', fontWeight: 'bold' } 
      }
    },
    subtextStyle: {
      color: '#aaa',
      fontSize: 12
    }
  },

  // ==========================================
  // 3. TOOLTIP
  // Controls the hover popup and crosshair guides
  // ==========================================
  tooltip: {
    show: true,
    trigger: 'axis', 
    axisPointer: {
      type: 'cross', 
      axis: 'auto', 
      snap: true, 
      z: 0,
      label: {
        show: true, 
        precision: 2, 
        margin: 8,
        color: '#fff',
        backgroundColor: '#dd6b20',
        borderColor: 'transparent',
        borderWidth: 0,
        shadowBlur: 3,
        shadowColor: 'rgba(0,0,0,0.3)'
      },
      lineStyle: { 
        color: 'rgba(255,255,255,0.3)',
        width: 1,
        type: 'dashed', 
        cap: 'butt',
        join: 'bevel'
      },
      shadowStyle: { 
        color: 'rgba(150,150,150,0.1)'
      }
    },
    showContent: true, 
    alwaysShowContent: false, 
    triggerOn: 'mousemove|click', 
    showDelay: 0, 
    hideDelay: 100, 
    enterable: true, 
    renderMode: 'html', 
    confine: true, 
    appendToBody: false, 
    transitionDuration: 0.2, 
    padding: 10,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderColor: '#dd6b20',
    borderWidth: 1,
    textStyle: { color: '#fff', fontSize: 12 },
    extraCssText: 'backdrop-filter: blur(4px);' 
  },

  // ==========================================
  // 4. GRID
  // The physical bounding box that holds the data points
  // ==========================================
  grid: {
    show: true, 
    zlevel: 0,
    z: 0,
    left: '10%',
    top: 80, 
    right: '10%',
    bottom: 60,
    width: 'auto', 
    height: 'auto',
    containLabel: true, 
    backgroundColor: 'transparent', 
    borderColor: '#333', 
    borderWidth: 1,
    shadowBlur: 0,
    tooltip: { show: false } 
  },

  // ==========================================
  // 5. X-AXIS
  // Horizontal scaffolding and vertical grid lines
  // ==========================================
  xAxis: {
    show: true,
    gridIndex: 0, 
    position: 'bottom', 
    offset: 0, 
    type: 'category', 
    name: 'Time of Day', 
    nameLocation: 'end', 
    nameTextStyle: { color: '#888', fontStyle: 'italic' }, 
    nameGap: 15, 
    nameRotate: 0, 
    inverse: false, 
    boundaryGap: false, 
    axisLine: {
      show: true,
      onZero: true, 
      symbol: ['none', 'arrow'], 
      symbolSize: [10, 15],
      lineStyle: { color: '#333', width: 1, type: 'solid' }
    },
    axisTick: {
      show: true,
      alignWithLabel: true, 
      interval: 'auto', 
      inside: false, 
      length: 5, 
      lineStyle: { color: '#555', width: 1 }
    },
    axisLabel: {
      show: true,
      interval: 'auto', 
      inside: false, 
      rotate: 45, 
      margin: 12, 
      formatter: '{value}', 
      showMinLabel: true, 
      showMaxLabel: true, 
      hideOverlap: true, 
      color: '#fff',
      fontSize: 10,
      backgroundColor: 'transparent', 
      padding: 0
    },
    splitLine: {
      show: true,
      interval: 'auto',
      lineStyle: { color: ['rgba(255,255,255,0.05)'], width: 1, type: 'solid' } 
    },
    minorTick: { show: false, splitNumber: 5, length: 3, lineStyle: { color: '#444' } },
    minorSplitLine: { show: false, lineStyle: { color: '#222' } },
    splitArea: {
      show: false,
      interval: 'auto',
      areaStyle: { color: ['rgba(250,250,250,0.05)', 'rgba(200,200,200,0.02)'] } 
    }
  },

  // ==========================================
  // 6. Y-AXIS
  // Vertical scaffolding and horizontal grid lines
  // ==========================================
  yAxis: {
    type: 'value',
    position: 'left', 
    min: 0, 
    max: function (value) { return value.max + 100; }, 
    scale: true, 
    splitNumber: 5, 
    minInterval: 1, 
    maxInterval: 500, 
    // Y-Axis supports the exact same axisLine, axisTick, axisLabel, and splitLine properties as X-Axis
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#fff', fontSize: 10 },
    splitLine: {
      show: true,
      lineStyle: { color: 'rgba(255,255,255,0.05)', width: 1, type: 'solid' }
    }
  },

  // ==========================================
  // 7. VISUAL MAP
  // Automatically colors data points based on their value
  // ==========================================
  visualMap: {
    show: false, 
    type: 'continuous', 
    min: 0,
    max: 5000,
    dimension: 1, 
    inRange: {
      color: ['#3182ce', '#dd6b20', '#e53e3e'] 
    }
  },

  // ==========================================
  // 8. TOOLBOX
  // Built-in interactive UI buttons for the user
  // ==========================================
  toolbox: {
    show: true,
    orient: 'horizontal', 
    itemSize: 15, 
    itemGap: 10, 
    showTitle: true, 
    left: 'auto',
    right: 20, 
    top: 20,
    bottom: 'auto',
    zlevel: 0,
    z: 2,
    iconStyle: {
      borderColor: '#888',
      borderWidth: 1.5,
      borderType: 'solid',
      borderCap: 'round',
      borderJoin: 'round'
    },
    emphasis: {
      iconStyle: {
        borderColor: '#dd6b20', 
        shadowBlur: 5,
        shadowColor: 'rgba(221, 107, 32, 0.5)'
      }
    },
    feature: {
      saveAsImage: {
        show: true,
        type: 'png', 
        name: 'chart_export', 
        backgroundColor: '#1a1a1a', 
        connectedBackgroundColor: '#fff', 
        excludeComponents: ['toolbox', 'dataZoom'], 
        pixelRatio: 2, 
        title: 'Download PNG' 
      },
      dataView: {
        show: true,
        title: 'View Raw Data',
        readOnly: false, 
        lang: ['Data View', 'Close', 'Refresh'], 
        backgroundColor: '#222', 
        textColor: '#eee', 
        textareaColor: '#111', 
        textareaBorderColor: '#444',
        buttonColor: '#dd6b20',
        buttonTextColor: '#fff'
      },
      magicType: {
        show: true,
        type: ['line', 'bar', 'stack'], 
        title: {
          line: 'Switch to Line Chart',
          bar: 'Switch to Bar Chart',
          stack: 'Stack Data', 
          tiled: 'Tile Data'
        }
      },
      dataZoom: {
        show: true,
        title: {
          zoom: 'Drag to Zoom',
          back: 'Reset Zoom'
        },
        xAxisIndex: 0, 
        yAxisIndex: false, 
        brushStyle: { 
          borderWidth: 1,
          color: 'rgba(221, 107, 32, 0.2)', 
          borderColor: 'rgba(221, 107, 32, 0.8)'
        }
      },
      brush: {
        type: ['rect', 'polygon', 'keep', 'clear'], 
        title: {
          rect: 'Rectangle Select',
          polygon: 'Lasso Select',
          lineX: 'Horizontal Select',
          lineY: 'Vertical Select',
          keep: 'Multiple Selections',
          clear: 'Clear Selection'
        }
      },
      restore: {
        show: true,
        title: 'Reset Chart'
      }
    }
  },

  // ==========================================
  // 9. DATA ZOOM
  // Scrollbars and zooming mechanics
  // ==========================================
  dataZoom: [
    {
      type: 'slider', // Physical scrollbar UI under the chart
      show: true,
      xAxisIndex: [0], // Attaches to the first x-axis
      start: 0, // Starts at 0% of data
      end: 100, // Ends at 100% of data
      bottom: 10, // Distance from bottom of canvas
      borderColor: '#333',
      fillerColor: 'rgba(221, 107, 32, 0.2)', // Color of the selected range
      handleStyle: {
        color: '#dd6b20',
        shadowBlur: 3,
        shadowColor: 'rgba(0, 0, 0, 0.6)'
      },
      textStyle: { color: '#fff' }
    },
    {
      type: 'inside', // Enables invisible mouse-wheel zooming
      xAxisIndex: [0],
      start: 0,
      end: 100,
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
      moveOnMouseWheel: true
    }
  ],

  // ==========================================
  // 10. SERIES
  // The actual data rendering configuration
  // ==========================================
  series: [
    {
      type: 'line',
      name: 'No of posts',
      data: [120, 200, 150, 80, 70, 110, 130],
      coordinateSystem: 'cartesian2d',
      xAxisIndex: 0, 
      yAxisIndex: 0, 
      
      symbol: 'circle', 
      symbolSize: 6,
      symbolRotate: 0,
      showSymbol: true, 
      showAllSymbol: 'auto', 
      
      step: false, 
      smooth: 0.5, 
      smoothMonotone: 'x', 
      
      connectNulls: false, 
      
      label: {
        show: true,
        position: 'top', 
        distance: 5, 
        rotate: 0,
        offset: [0, 0], 
        formatter: '{c}', 
        color: '#fff',
        fontSize: 10,
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: [2, 4],
        borderRadius: 2
      },
      
      itemStyle: {
        color: '#dd6b20', 
        borderColor: '#ffffff', 
        borderWidth: 2, 
        borderType: 'solid',
        shadowBlur: 5,
        shadowColor: 'rgba(221, 107, 32, 0.5)',
        opacity: 1
      },
      
      lineStyle: {
        color: '#dd6b20',
        width: 3,
        type: 'solid', 
        cap: 'round', 
        join: 'round', 
        shadowBlur: 10,
        shadowColor: 'rgba(221, 107, 32, 0.3)',
        shadowOffsetY: 5,
        opacity: 1
      },
      
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(221, 107, 32, 0.8)' },
            { offset: 1, color: 'rgba(221, 107, 32, 0.0)' }
          ]
        },
        origin: 'start', 
        shadowBlur: 0,
        opacity: 1
      },
      
      emphasis: {
        focus: 'series', 
        blurScope: 'coordinateSystem', 
        scale: true, 
        itemStyle: { borderColor: '#dd6b20', borderWidth: 4, shadowBlur: 10 }, 
        lineStyle: { width: 5 }, 
        label: { show: true, fontSize: 14, fontWeight: 'bold' } 
      },
      
      blur: {
        itemStyle: { opacity: 0.2 },
        lineStyle: { opacity: 0.2 },
        areaStyle: { opacity: 0.1 }
      },
      
      markPoint: {
        symbol: 'pin',
        symbolSize: 40,
        itemStyle: { color: '#e53e3e' },
        label: { color: '#fff' },
        data: [
          { type: 'max', name: 'Peak Volume' },
          { type: 'min', name: 'Lowest Volume' },
          { coord: ['12:00', 3500], name: 'Lunch Rush' }
        ]
      },
      
      markLine: {
        silent: true, 
        lineStyle: { type: 'dashed', color: '#718096' },
        label: { position: 'end', formatter: 'Avg: {c}' },
        data: [
          { type: 'average', name: 'Daily Average' },
          { yAxis: 2000, name: 'Target Goal' } 
        ]
      },
      
      markArea: {
        itemStyle: { color: 'rgba(255, 255, 255, 0.05)' },
        label: { position: 'insideTop', color: '#fff', opacity: 0.5 },
        data: [
          [
            { name: 'Maintenance Window', xAxis: '02:00' },
            { xAxis: '06:00' }
          ]
        ]
      }
    }
  ]
};

export default exhaustiveEChartsOption;
