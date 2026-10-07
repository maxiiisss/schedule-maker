"use client"

import { useCallback, useEffect, useState } from "react"

import type { Person } from "@/lib/schedule/compare"
import { readPeople, withPerson, writePeople, type AddPersonResult } from "@/lib/schedule/people"
import type { Course } from "@/lib/schedule/types"

/**
 * Other people's schedules kept on this device, to compare with the user's own.
 * Loaded after mount so server and client markup match.
 */
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPeople(readPeople())
    setReady(true)
  }, [])

  const commit = useCallback((next: Person[]) => {
    setPeople(next)
    writePeople(next)
  }, [])

  const add = useCallback(
    (input: { name: string; courses: Course[]; sourceId?: string }): AddPersonResult => {
      // Read storage again: another tab or page may have added someone meanwhile.
      const result = withPerson(readPeople(), input)
      if (result.ok) commit(result.people)
      return result
    },
    [commit],
  )

  const rename = useCallback(
    (id: string, name: string) =>
      commit(people.map((person) => (person.id === id ? { ...person, name: name.trim() || person.name } : person))),
    [people, commit],
  )

  const toggle = useCallback(
    (id: string) =>
      commit(people.map((person) => (person.id === id ? { ...person, visible: !person.visible } : person))),
    [people, commit],
  )

  const remove = useCallback(
    (id: string) => commit(people.filter((person) => person.id !== id)),
    [people, commit],
  )

  const restore = useCallback((next: Person[]) => commit(next), [commit])

  return { people, ready, add, rename, toggle, remove, restore }
}
