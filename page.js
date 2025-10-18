import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Loader2, Upload } from 'lucide-react'

export default function FoodSynonymLocal() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split('\n').filter(Boolean)
      const data = lines.map((line, i) => {
        const [id, name, updated] = line.split(',')
        return { id: id?.trim() || `F${1000 + i}`, name: name?.trim(), updated_at: updated?.trim() || '', synonyms: [] }
      })
      setFoods(data)
    }
    reader.readAsText(file)
  }

const handleGenerate = async (food) => {
  setLoading(true)
  setSelectedFood(food.id)

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodName: food.name,
        prompt: '식품명에 대한 유의어를 5개 생성해 주세요'
      })
    })

    const data = await res.json()

    if (data.text) {
      // text에서 숫자 리스트 추출
      const lines = data.text
        .split('\n')
        .map((l) => l.replace(/^[0-9.\s-]+/, '').trim())
        .filter((l) => l && !l.includes('유의어'))

      const newSynonyms = lines.map((s) => ({
        synonym: s,
        type: 'AI 생성 결과',
      }))

      setFoods((prev) =>
        prev.map((f) =>
          f.id === food.id ? { ...f, synonyms: newSynonyms } : f
        )
      )
    } else {
      alert(data.error || '응답이 비어 있습니다.')
    }
  } catch (err) {
    console.error(err)
    alert('API 요청 중 오류 발생')
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📁 실제 CSV 데이터 기반 식품 유의어 생성</h1>

      <Card>
        <CardHeader>
          <CardTitle>데이터 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} />
            <p className="text-sm text-gray-500">CSV 형식: food_id, 식품명, updated_at</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food ID</TableHead>
                <TableHead>식품명</TableHead>
                <TableHead>업데이트 일자</TableHead>
                <TableHead>유의어 생성</TableHead>
                <TableHead>생성 결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell>{food.id}</TableCell>
                  <TableCell>{food.name}</TableCell>
                  <TableCell>{food.updated_at}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(food)}
                      disabled={loading}
                    >
                      {loading && selectedFood === food.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : null}
                      생성
                    </Button>
                  </TableCell>
                  <TableCell>
                    {food.synonyms.length > 0 ? (
                      <ul className="text-sm">
                        {food.synonyms.map((s, i) => (
                          <li key={i}>
                            <span className="font-semibold">{s.synonym}</span> — {s.type}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-sm">미생성</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
