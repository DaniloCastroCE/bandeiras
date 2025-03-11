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

        const responses = await Promise.all(urls.map(url => fetch(url)));

        responses.forEach(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição da API: ${response.statusText}`);
            }
        });

        const data = await Promise.all(responses.map(response => response.json()));

        callback(data);
    } catch (err) {
        console.error(`Erro na função getApi.\nErro: ${err}`);
    }
};

let paises = []
let paisesOrdenados = []
let loading = false
let speak = false
let mapGoogle = ''

document.querySelector('body').addEventListener('keydown', (event) => {
    const key = event.key
    if (key === 'Enter' || key === ' ') {
        gerarBandeira(paisesOrdenados)
    }
})

getApi('https://restcountries.com/v3.1/all', (result) => {
    paises = result
    paisesOrdenados = ordenarPopulacao(result,250)
    console.log(`Array paises (${paises.length})\nArray paisesOrdenados (${paisesOrdenados.length})`)
    console.log(paisesOrdenados)
})

const ordenarPopulacao = (array,max) => {
    return array.sort((a, b) => b.population - a.population).slice(0, max);
}


const alterarGif = () => {
    const max = 30
    const gif = document.querySelector('#gifLoading')
    const num = Math.floor(Math.random() * max) + 1
    gif.src = `./img/loading${num}.gif`
    
}

const on_mapGoogle = () => {
    let linkMap = ''
    if(mapGoogle === ""){
        const brasil = paisesOrdenados.find( b => b.name.common.toLowerCase() === 'brazil')
        mapGoogle = brasil.maps.googleMaps
    }

    window.open(mapGoogle, '_blank');
}

const gerarBandeira = (array) => {
    if(!loading && !speak){
        const gif = document.querySelector('#gifLoading')
        gif.src = ""
        if(typeof array === 'undefined'){
            array = paisesOrdenados
        }    
        alterarGif()
        const elLoading = document.querySelector('#loading')
        const box = document.querySelector('.box')
        const img = document.querySelector('#imgBandeira')
        const nome = document.querySelector('#nomeBandeira')
        const info = document.querySelector('#info')
        const num = Math.floor(Math.random() * (array.length))
        const nomeIngles = array[num].name.common.toUpperCase()
        mapGoogle = array[num].maps.googleMaps
    
        //console.log(array[num])
    
        img.src = ''
        nome.innerHTML = ''
        info.innerHTML = ''
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
                }
            )
    
            let urls = [`https://api.mymemory.translated.net/get?q=${encodeURIComponent(array[num].region)}&langpair=en|pt`]
            for (let i = 0; i < Object.keys(array[num].languages).length; i++) {
                urls.push(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(Object.values(array[num].languages)[i])}&langpair=en|pt`)
            }
    
            //console.log(urls)
    
            
    
            getApiMult(
                urls,
                (result) => {
                    let texto = ''
                    result.forEach((textInfo, index) => {
                        if(index === 0){
                            const regiao = (textInfo.responseData.translatedText === 'África:') ? 'África' : textInfo.responseData.translatedText
                            texto = `Região ${regiao}<br> Idioma`
    
                        }else if (index > 0){
                            const idioma = textInfo.responseData.translatedText
                            texto += ` ${idioma.charAt(0).toUpperCase() + idioma.slice(1).toLowerCase()}`
                            if(index+2 < result.length){
                                texto += ', '
                            }else if((index+2 === result.length)){
                                texto += ' e '
                            }
                        }
                    })
                    //console.log(texto)
                    info.innerHTML += `${nomeIngles}<br>`
                    info.innerHTML += `Sigla ${array[num].cca3}<br>`
                    info.innerHTML += `População (${num+1}º) ${array[num].population}<br>`
                    info.innerHTML += texto

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

const falar = (texto) => {
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

window.onload = () => {
    alterarGif()
    falar("Brasil")
}

