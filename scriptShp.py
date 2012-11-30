# This Python file uses the following encoding: utf-8

import commands
import string
import libxml2
import unicodedata
import re
import codecs

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
	output.write('id,nombre,filename,limite,partido,provincia,aglomerado,n,s,e,w,t0_edge,t0_open,t1_edge,t1_open \n')
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



			cmd='''ogr2ogr ''' + outputkml +''' "'''  + sourceShp + '''" -f "KML"'''
			#print cmd
					
			p=commands.getoutput(cmd)
			doc=libxml2.parseFile(outputkml)
			ctxt = doc.xpathNewContext() 
			ctxt.xpathRegisterNs('kml', "http://www.opengis.net/kml/2.2")
			res = doc.xpathEval('//*')



 			for r in res:
				if  r.name == 'Polygon':
					polyPoints = r.content
					locationPolygon = '<Polygon><outerBoundaryIs><LinearRing><coordinates>' + r.content + '</coordinates></LinearRing></outerBoundaryIs></Polygon>'
					polygonMap[name]=r.content

			getImages(name,folder,outputPath)
			(t0_edge,t0_open,t1_edge,t1_open)=getDataIndex(name,folder,outputPath)
			
			output.write(str(Rid) + ',' + realName)
			output.write(',' + name + ',"' + locationPolygon + '","' + partido+ '","' + provincia + '","' + aglomerado + '", , , , ,' + t0_edge + ',' + t0_open +',' + t1_edge +',' + t1_open + ' \n')
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

	imageNames=['urbArea_t0.img','urbArea_t1.img','urbFootprint_t0.img','urbFootprint_t1.img','New_Development_t0_t1.img']
	imageNamesPng=['urbArea_t0.png','urbArea_t1.png','urbFootprint_t0.png','urbFootprint_t1.png','New_Development.png']
	
	for image in imageNames:
		cmd = '''find ''' + folder + '''  -name ''' + image
		output=commands.getoutput(cmd)
		if(len(output)==0):
			urb_area_t0_counter=urb_area_t0_counter +1 

		cmd = ''' cp ''' + output + ''' ''' + outputFolder 
		print cmd
		commands.getoutput(cmd)
		#convert images
		outputImagePng = outputFolder+ '/' + image.replace('img','png')

		print outputImagePng
		cmd = ''' python pct2rgb.py -of PNG ''' +  output + ''' ''' + outputImagePng
		output= commands.getoutput(cmd)
		print output

	

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


output_hits = 0
error_hits  = 0
total_hits =0
urb_area_t0_counter = 0
urb_area_t1_counter = 0
urb_footprint_t0_counter = 0
urb_footprint_t1_counter = 0
resultados_counter = 0

main()
