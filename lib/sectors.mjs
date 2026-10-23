import map from './sectors.json' with {type:'json'};
function inside(point,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>point[1])!==(yj>point[1])&&point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi)result=!result;}return result;}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/d)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
export function classifyPoint(point){
 const [lon,lat]=point,M=map.matrix,p=[lon*M[0][0]+lat*M[1][0]+M[2][0],lon*M[0][1]+lat*M[1][1]+M[2][1]];
 let sector=1;for(const s of [2,3,4])if(inside(p,map.polygons[s]))sector=s;
 let distance=Infinity;
 for(const poly of Object.values(map.polygons))for(let i=1;i<poly.length;i++)distance=Math.min(distance,segmentDistance(p,poly[i-1],poly[i]));
 const metres=distance*26;
 return {sector,certain:metres>=map.uncertaintyMetres,distanceToBoundary:Math.round(metres)};
}
