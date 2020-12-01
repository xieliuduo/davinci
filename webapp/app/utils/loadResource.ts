/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */


const resourceCache = {}
import { STATIC_FILE_PATH } from 'app/globalConstants'
import request from 'app/utils/request'
const publicUrlReg = /^((http|https):\/\/|\/\/)/
function handleUrl(url) {
    if (publicUrlReg.test(url)) {
        return url
    }
    return STATIC_FILE_PATH + url
}
export default function loadResource(url: string) {
    if (url.endsWith('.js')) {
       return loadScript(handleUrl(url))
    } else if (url.endsWith('.css')) {
       return loadStyle(handleUrl(url))
    }
}

export const loadScript = (url: string) => {
    const head = document.getElementsByTagName('head')[0]
    return new Promise((resolve, reject) => {
        if (resourceCache[url]) {
            resolve(true)
        } else {
            const script = document.createElement('script')
            script.src = url
            script.async = true
            script.type = 'text/javascript'
            script.onload = function() {
                head.removeChild(script)
                resourceCache[url] = true
                resolve(true)
            }
            script.onerror = function() {
                head.removeChild(script)
                reject(false)
            }
            head.appendChild(script)
        }


    })
}

export const loadStyle = (url: string) => {
    const head = document.getElementsByTagName('head')[0]
    return new Promise((resolve, reject) => {
        if (resourceCache[url]) {
            resolve(true)
        } else {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = url
            link.type = 'text/css'
            link.onload = function() {
             head.removeChild(link)
             resolve(true)
        }
            link.onerror = function() {
            head.removeChild(link)
            reject(false)
        }
            head.appendChild(link)
        }

    })
}
export const loadFile = (url: string) => {
    if (publicUrlReg.test(url)) {
        return fetch(url)
    }
    return request(STATIC_FILE_PATH + url)
}
