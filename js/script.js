const getApi = async (url, callback) => {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Erro na requisição da api.')
        }
        const data = await response.json()
        callback(data)
    } catch (err) {
        console.error(`Erro na função getAPi.\nErro:${err}`)
    }
}

const getApiMult = async (urls, callback) => {
    try {
        if (!Array.isArray(urls)) {
            urls = [urls];
        }

        const responses = await Promise.all(urls.map(url => fetch(url.url)));

        responses.forEach(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição da API: ${response.statusText}`);
            }
        });

        const data = await Promise.all(responses.map(response => response.json()));
        //callback(data);

        const result = data.map((item, index) => ({
            ...item,
            traduzir: urls[index].traduzir
        }))

        callback(result);

    } catch (err) {
        console.error(`Erro na função getApi.\nErro: ${err}`);
    }
};

const init = (obj) => {
    const info = document.querySelector('#info')
    const brasao = document.querySelector('#brasao')
    const pos = posAreaPais(areaOrdenada, obj.name.common)
    const textPosArea = (pos > 0) ? `(${pos}º) ` : ''
    info.innerHTML = `${obj.name.common.toUpperCase()}<br>`
    info.innerHTML += `Capital: Brasília<br>`
    info.innerHTML += "Continente: Ámérica do Sul<br>"
    info.innerHTML += `Sigla: ${obj.cca3}<br>`
    info.innerHTML += `População com ${obj.population.toLocaleString('pt-BR')} &nbsp(6º)<br>`
    info.innerHTML += `Área de ${obj.area.toLocaleString('pt-BR')} Km² &nbsp${textPosArea}<br>`
    info.innerHTML += "Idioma: Português"
    if (obj.coatOfArms.svg !== undefined) brasao.src = obj.coatOfArms.svg
    falar('Brasil')
    paisSelecionado = 'Brasil'
}

let paises = []
let paisesOrdenados = []
let areaOrdenada = []
let loading = false
let speak = false
let mapGoogle = ''
let paisSelecionado = ''

document.querySelector('body').addEventListener('keydown', (event) => {
    const key = event.key
    if (key === 'Enter' || key === ' ') {
        gerarBandeira(paisesOrdenados)
    }
})

getApi('https://restcountries.com/v3.1/all', (result) => {
    paises = result
    paisesOrdenados = ordenarPopulacao(result, 250)
    areaOrdenada = returnOrdenadoArea(paises)
    console.log(`Array paises (${paises.length})\nArray paisesOrdenados (${paisesOrdenados.length})`)
    console.log(paisesOrdenados)

    init(result.find(pais => pais.name.common === 'Brazil'))
})



const ordenarPopulacao = (array, max) => {
    return array.sort((a, b) => b.population - a.population).slice(0, max)
}

const returnOrdenadoArea = (array) => {
    let paises = array.map(
        pais => ({ nome: pais.name.common, area: pais.area })
    ).sort(
        (a, b) => b.area - a.area
    )
    return paises.filter(pais => pais.nome !== 'Antarctica')
}

const posAreaPais = (array, nome) => {
    if (nome !== 'Antarctica') {
        return array.findIndex(
            pais => pais.nome.toLowerCase().trim() === nome.toLowerCase().trim()
        ) + 1
    } else {
        return 0
    }
}


const alterarGif = () => {
    const max = 30
    const gif = document.querySelector('#gifLoading')
    const num = Math.floor(Math.random() * max) + 1
    gif.src = `./img/loading${num}.gif`

}

const on_mapGoogle = () => {
    let linkMap = ''
    if (mapGoogle === "") {
        const brasil = paisesOrdenados.find(b => b.name.common.toLowerCase() === 'brazil')
        mapGoogle = brasil.maps.googleMaps
    }

    window.open(mapGoogle, '_blank');
}

const formatarPalavra = (palavra) => {
    if(palavra === 'África:'){
        palavra = 'África'
    }else if (palavra === 'French') {
        palavra = 'Francês'
    }else if (palavra === 'Spanish') {
        palavra = 'Espanhol'
    }else if (palavra === 'Portuguese') {
        palavra = 'Português'
    }else if (palavra === 'Dutch') {
        palavra = 'Holandês'
    }else if (palavra === 'Finnish') {
        palavra = 'Finlandês'
    }else if (palavra === 'Swedish') {
        palavra = 'Sueco'
    }else if (palavra === 'Romanian') {
        palavra = 'Romeno'
    }
    return palavra[0].toUpperCase() + palavra.slice(1).toLowerCase()
} 

const gerarBandeira = (array) => {
    if (!loading && !speak) {
        const gif = document.querySelector('#gifLoading')
        gif.src = ""
        if (typeof array === 'undefined') {
            array = paisesOrdenados
        }
        alterarGif()
        const elLoading = document.querySelector('#loading')
        const box = document.querySelector('.box')
        const img = document.querySelector('#imgBandeira')
        const nome = document.querySelector('#nomeBandeira')
        const info = document.querySelector('#info')
        const brasao = document.querySelector('#brasao')
        const num = Math.floor(Math.random() * (array.length))
        //const num = 249
        const nomeIngles = array[num].name.common.toUpperCase()
        mapGoogle = array[num].maps.googleMaps

        //console.log(array[num])

        img.src = ''
        nome.innerHTML = ''
        info.innerHTML = ''
        brasao.src = ''
        box.style.display = 'none'
        elLoading.style.display = 'flex'
        loading = true
        setTimeout(() => {
            getApi(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(nomeIngles)}&langpair=en|pt`,
                (result) => {
                    const nomeBandeira = (result.responseData.translatedText !== '') ?
                        result.responseData.translatedText.toUpperCase() :
                        nomeIngles
                    nome.innerHTML = nomeBandeira
                    falar(nomeBandeira)
                    paisSelecionado = nomeBandeira
                }
            )

            let urls = [{traduzir:"region",url:`https://api.mymemory.translated.net/get?q=${encodeURIComponent(array[num].region)}&langpair=en|pt`}]
             
            for (let i = 0; i < Object.keys(array[num].capital).length; i++) {
                urls.push({traduzir:"capital",url:`https://api.mymemory.translated.net/get?q=${encodeURIComponent(Object.values(array[num].capital)[i])}&langpair=en|pt`})
                
            }
            
            for (let i = 0; i < Object.keys(array[num].languages).length; i++) {
                urls.push({traduzir:"languages",url:`https://api.mymemory.translated.net/get?q=${encodeURIComponent(Object.values(array[num].languages)[i])}&langpair=en|pt`})
            }
            
            for (let i = 0; i < Object.keys(array[num].continents).length; i++) {
                urls.push({traduzir:"continents",url:`https://api.mymemory.translated.net/get?q=${encodeURIComponent(Object.values(array[num].continents)[i])}&langpair=en|pt`})
                
            }

            getApiMult(
                urls,
                (result) => {
                    let regiao = ''
                    let idioma = ''
                    let continentes = ''
                    let capital = ''
                    
                    const arrayRegion = result.filter(obj => obj.traduzir === 'region')
                    const arrayCapital = result.filter(obj => obj.traduzir === 'capital')
                    const arrayLanguages = result.filter(obj => obj.traduzir === 'languages')
                    const arrayContinents = result.filter(obj => obj.traduzir === 'continents')
                                        
                    regiao += formatarPalavra(arrayRegion[0].responseData.translatedText)

                    if(arrayCapital.length === 1){
                        capital = formatarPalavra(arrayCapital[0].responseData.translatedText)
                    }else {
                        const nomes = arrayCapital.map(nome => formatarPalavra(nome.responseData.translatedText))
                        capital = nomes.slice(0,-1).join(', ') + " e " + nomes[nomes.length - 1] 
                    }

                    if(arrayLanguages.length === 1){
                        idioma = formatarPalavra(arrayLanguages[0].responseData.translatedText)
                    }else {
                        const nomes = arrayLanguages.map(nome => formatarPalavra(nome.responseData.translatedText))
                        idioma = nomes.slice(0,-1).join(', ') + " e " + nomes[nomes.length - 1] 
                    }

                    if(arrayContinents.length === 1){
                        continentes = formatarPalavra(arrayContinents[0].responseData.translatedText)
                    }else {
                        const nomes = arrayContinents.map(nome => formatarPalavra(nome.responseData.translatedText))
                        continentes += nomes.slice(0,-1).join(', ') + " e " + nomes[nomes.length - 1] 
                    }

                    const pos = posAreaPais(areaOrdenada, nomeIngles)
                    const textPosArea = (pos > 0) ? `(${pos}º) ` : ''
                    info.innerHTML += `${nomeIngles}<br>`
                    info.innerHTML += `Capital: ${capital}<br>`
                    info.innerHTML += `Continente: ${continentes}<br>`
                    info.innerHTML += `Sigla: ${array[num].cca3}<br>`
                    info.innerHTML += `População com ${array[num].population.toLocaleString('pt-BR')}  (${num + 1}º)<br>`
                    info.innerHTML += `Área de ${array[num].area.toLocaleString('pt-BR')} Km²  ${textPosArea}<br>`
                    info.innerHTML += `Idioma: ${idioma}`
                    if (array[num].coatOfArms.svg !== undefined) brasao.src = array[num].coatOfArms.svg
                }
            )

            /*getApi(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(array[num].flags.alt)}&langpair=en|pt`, 
                (result) => {
                    alert(result.responseData.translatedText)
                }
            )*/

            document.querySelector('#favicon').href = array[num].flags.png
            img.src = array[num].flags.svg
            elLoading.style.display = 'none'
            box.style.display = 'flex'
            loading = false
            /*
            const gif = document.querySelector('#gifLoading')
            gif.src = ""
            */
        }, 3000);
    }

}

const onclickNome = () => {
    if(!speak) {
        falar()
    }
}

const falar = (texto) => {
    if(typeof texto === 'undefined'){
        texto = paisSelecionado
    }
    const iconSpeak = document.querySelector('#boxIconSpeak')
    const imgBandeira = document.querySelector('#imgBandeira')
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    /*
    const vozes = window.speechSynthesis.getVoices()
    let vozGoogle = null

    for (let i = 0; i < vozes.length; i++) {
        if (vozes[i].name.toLowerCase().includes('google')) {
            vozGoogle = vozes[i]
            break
        }
    }

    if (vozGoogle) {
        utterance.voice = vozGoogle
    }
    */

    utterance.onstart = () => {
        speak = true
        iconSpeak.style.display = 'block'
        imgBandeira.style.cursor = 'default'
    }

    utterance.onend = () => {
        speak = false
        iconSpeak.style.display = 'none'
        imgBandeira.style.cursor = 'pointer'
    }

    window.speechSynthesis.speak(utterance)
}


