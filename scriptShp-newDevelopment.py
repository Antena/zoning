# This Python file uses the following encoding: utf-8

import commands
import string
import libxml2
import unicodedata
import re
import codecs
from osgeo import osr, gdal


def main():
	global output_hits
	global error_hits
	global urb_area_t0_counter
	global urb_area_t1_counter
	global urb_footprint_t0_counter
	global urb_footprint_t1_counter
	global resultados_counter

	polygonMap=dict()

	commands.getoutput('mkdir output')
	output=open('output/output.csv','w')
	locationCoordinates= ''
	locationPolygon = ''
	Rid=1
	output_hits=0
	resultados_counter = 0 
	lines = open('municipios.csv','r')	
	lines = iter(lines)
	lines.next()
	output.write('Id,Nombre,filename,limite,partido,provincia,aglomerado,N,S,E,W,t0_edge,t0_open,t1_edge,t1_open \n')
	for l in lines:
		try:
			
			(idd,name,partido,provincia,aglomerado,folder,agregado)=l.split(',')
		
			realName=name
			name=name.replace('ñ','n')
			name=fixName(unicode(name.rstrip(),'utf-8'))
			provincia=elimina_tildes(unicode(provincia.rstrip(),'utf-8'))
			aglomerado=elimina_tildes(unicode(aglomerado.rstrip(),'utf-8'))
			partido=elimina_tildes(unicode(partido.rstrip(),'utf-8'))			
			print name


			sourceShp=getPath(name,folder)
			outputPath='''output/''' + name + '/'

			
			cmd ='''mkdir output/''' + name
			commands.getoutput(cmd)

			outputkml = outputPath + name + '.kml'



			#cmd='''ogr2ogr ''' + outputkml +''' "'''  + sourceShp + '''" -f "KML"'''
			#print cmd
			
			
			
			outputPath="/Users/dnul/RepoAntena/zoning/public/assets/images/townships/" + name 
			(n,s,e,w)=getImages(name,folder,outputPath)
			#(t0_edge,t0_open,t1_edge,t1_open)=getDataIndex(name,folder,outputPath)
			
			#output.write(str(Rid) + ',' + realName)
			#output.write(',' + name + ',"' + locationPolygon + '","' + partido+ '","' + provincia + '","' + aglomerado + '",'+ str(n) +',' + str(s) +',' + str(e) + ',' + str(w) +',' + t0_edge + ',' + t0_open +',' + t1_edge +',' + t1_open + ' \n')
			Rid=Rid+1


		except Exception as err:
			error_hits +=1
			print 'error' + str(err) + " localidad: " + name
	
	print "empty output hits: " + str(output_hits)
	print "error_hits hits: " + str(error_hits)
	print "urb_area_t0_counter " + str(urb_area_t0_counter)
	print "resultados.txt " + str(resultados_counter)
	checkPolygonMapDuplicates(polygonMap)

def getPath(name,folder):
	global output_hits
	#cmd = '''find ''' + folder + '''  -name  "''' + name + '''" ''' 
	cmd = '''find ''' + folder + '''  -name  *.shp ''' 
	#print 'FIND command:' + cmd
	
	locOutput=commands.getoutput(cmd)
	if len(locOutput)==0:
		output_hits+=1
	hits=locOutput.split('\n')
	if(len(hits)>1):
		print hits
		for hit in hits:
			if hit.find('localidad') == -1:
				return hit
	else:
		#print 'FIND output ' +  locOutput
		pathLoc=locOutput[0:locOutput.find('.shp')+4]
		return pathLoc

def getDataIndex(name,folder,outputFolder):
	global resultados_counter
	values=[]
	cmd = '''find ''' + folder + '''  -name resultados.txt''' 

	data_index_names = ['t0 EDGE INDEX is','t0 OPENNESS INDEX is','t1 EDGE INDEX is','t1 OPENNESS INDEX is']

	output=commands.getoutput(cmd)
	if(len(output)==0):
		resultados_counter +=1
		return ('','','','')

	resultados_file = open(output)
	lines=resultados_file.readlines()
	for line in lines:
		for data_name in data_index_names:
			number=re.findall(data_name + " \d+\.?\d*",line)
			if len(number)>0:
				for a in number:
					number_str = a[len(data_name)+1:]
					values+=[number_str]
				

	return values

def getImages(name,folder,outputFolder):
	global urb_area_t0_counter
	global urb_area_t1_counter
	global urb_footprint_t0_counter
	global urb_footprint_t1_counter

	imageNames=['New_Development_t0_t1.img']
	imageNamesPng=['newDevelopment.png']
	
	for image in imageNames:
		cmd = '''find ''' + folder + '''  -name ''' + image
		output=commands.getoutput(cmd)

		if(len(output)==0):
			urb_area_t0_counter=urb_area_t0_counter +1 

		filename_img=  output
		cmd = ''' cp ''' + output + ''' ''' + outputFolder 
		#print cmd
		#commands.getoutput(cmd)
		#convert images
		outputImagePng = outputFolder+ '/' + imageNamesPng[imageNames.index(image)]


		print outputImagePng
		filename_img=  output
		cmd = ''' python pct2rgb.py -of PNG ''' +  output + ''' ''' + outputImagePng
		output= commands.getoutput(cmd)
		print output

		#get coordinates
		(e,w,n,s)=getCoordinates(filename_img)
		
 	return (n,s,e,w)	
		


	

def fixName(name):
	try:
		fixedName = elimina_tildes(name)
		fixedName = fixedName.replace(' ','_')
		fixedName = fixedName.replace('(','')
		fixedName = fixedName.replace(')','')

		#fixedName = elimina_tildes(fixedName)
	except Exception as err:
		print err
		#print "error with " + name		
	
	return fixedName


def elimina_tildes(cadena):
    # http://guimi.net
    
    # http://www.leccionespracticas.com/uncategorized/eliminar-tildes-con-python-solucionado/
    s = ''.join((c for c in unicodedata.normalize('NFD',unicode(cadena)) if unicodedata.category(c) != 'Mn'))
    return s.decode()

def checkPolygonMapDuplicates(polygonMap):
	for key in polygonMap.keys():
		for key2 in polygonMap.keys():
			if key != key2:
				if polygonMap[key]==polygonMap[key2]:
					print "key " + key + " equal to key: " + key2

def getCoordinates(imagePath):
	# get the existing coordinate system
	ds = gdal.Open(imagePath)
	old_cs= osr.SpatialReference()
	old_cs.ImportFromWkt(ds.GetProjectionRef())

	# create the new coordinate system
	wgs84_wkt = """
	GEOGCS["WGS 84",
	    DATUM["WGS_1984",
	        SPHEROID["WGS 84",6378137,298.257223563,
	            AUTHORITY["EPSG","7030"]],
	        AUTHORITY["EPSG","6326"]],
	    PRIMEM["Greenwich",0,
	        AUTHORITY["EPSG","8901"]],
	    UNIT["degree",0.01745329251994328,
	        AUTHORITY["EPSG","9122"]],
	    AUTHORITY["EPSG","4326"]]"""
	new_cs = osr.SpatialReference()
	new_cs .ImportFromWkt(wgs84_wkt)

	# create a transform object to convert between coordinate systems
	transform = osr.CoordinateTransformation(old_cs,new_cs) 

	#get the point to transform, pixel (0,0) in this case
	width = ds.RasterXSize
	height = ds.RasterYSize
	gt = ds.GetGeoTransform()
	minx = gt[0]
	miny = gt[3] + width*gt[4] + height*gt[5] 
	maxx = gt[0] + width*gt[1] + height*gt[2]
	maxy = gt[3]
	#get the coordinates in lat long
	(north,west,a) = transform.TransformPoint(minx,miny) 
	(south,east,a) = transform.TransformPoint(maxx,maxy)
	return (north,south,east,west)


output_hits = 0
error_hits  = 0
total_hits =0
urb_area_t0_counter = 0
urb_area_t1_counter = 0
urb_footprint_t0_counter = 0
urb_footprint_t1_counter = 0
resultados_counter = 0

main()
